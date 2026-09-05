const pool = require('../db');

// ═════════════════════════════════════════════════════════════════════════════
// EXAM SCHEDULES  (principal / teacher creates, students & parents view)
// ═════════════════════════════════════════════════════════════════════════════

const getExamSchedules = async ({ term_id, class_id, section_id, teacher_id } = {}) => {
  const conds = ['1=1'];
  const vals  = [];
  let   p     = 1;
  if (term_id)    { conds.push(`es.term_id = $${p++}`);    vals.push(term_id); }
  if (class_id)   { conds.push(`es.class_id = $${p++}`);   vals.push(class_id); }
  if (section_id) { conds.push(`es.section_id = $${p++}`); vals.push(section_id); }
  // teacher sees only subjects they teach in that timetable
  if (teacher_id) {
    conds.push(`
      es.curriculum_subject_id IN (
        SELECT t.curriculum_subject_id FROM timetables t
        WHERE t.teacher_id = $${p++} AND t.term_id = es.term_id
      )
    `);
    vals.push(teacher_id);
  }

  const { rows } = await pool.query(
    `SELECT
       es.*,
       sub.name AS subject_name, sub.code AS subject_code,
       c.name   AS class_name,
       sec.name AS section_name,
       t.name   AS term_name
     FROM exam_schedules es
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN classes  c   ON c.id   = es.class_id
     JOIN sections sec ON sec.id = es.section_id
     JOIN terms    t   ON t.id   = es.term_id
     WHERE ${conds.join(' AND ')}
     ORDER BY es.exam_date, sub.name`,
    vals
  );
  return rows;
};

const createExamSchedule = async (userId, fields) => {
  const { rows } = await pool.query(
    `INSERT INTO exam_schedules
       (term_id, academic_year_id, class_id, section_id, curriculum_subject_id,
        title, exam_date, start_time, end_time, venue, notes, is_published, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      fields.term_id, fields.academic_year_id, fields.class_id, fields.section_id,
      fields.curriculum_subject_id, fields.title, fields.exam_date,
      fields.start_time || null, fields.end_time || null,
      fields.venue || null, fields.notes || null,
      fields.is_published || false, userId,
    ]
  );
  return rows[0];
};

const updateExamSchedule = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE exam_schedules
     SET title        = COALESCE($1, title),
         exam_date    = COALESCE($2, exam_date),
         start_time   = COALESCE($3, start_time),
         end_time     = COALESCE($4, end_time),
         venue        = COALESCE($5, venue),
         notes        = COALESCE($6, notes),
         is_published = COALESCE($7, is_published),
         updated_at   = NOW()
     WHERE id = $8 RETURNING *`,
    [fields.title, fields.exam_date, fields.start_time, fields.end_time,
     fields.venue, fields.notes, fields.is_published, id]
  );
  return rows[0] || null;
};

const deleteExamSchedule = async (id) => {
  await pool.query(`DELETE FROM exam_schedules WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// MARK COMPONENTS  (breakdown of an exam e.g. Assignment=10, Final=90)
// ═════════════════════════════════════════════════════════════════════════════

const getMarkComponents = async (examScheduleId) => {
  const { rows } = await pool.query(
    `SELECT * FROM mark_components WHERE exam_schedule_id = $1 ORDER BY sort_order`,
    [examScheduleId]
  );
  return rows;
};

const upsertMarkComponents = async (examScheduleId, components) => {
  // Replace all components for this exam
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM mark_components WHERE exam_schedule_id = $1`, [examScheduleId]);
    const result = [];
    for (const [i, comp] of components.entries()) {
      const { rows } = await client.query(
        `INSERT INTO mark_components (exam_schedule_id, name, max_marks, sort_order)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [examScheduleId, comp.name, comp.max_marks, comp.sort_order ?? i]
      );
      result.push(rows[0]);
    }
    await client.query('COMMIT');
    return result;
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

// ═════════════════════════════════════════════════════════════════════════════
// STUDENT MARKS  (teacher enters marks per component per student)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Get all students in a section with their marks for a specific exam
 */
const getExamMarkSheet = async (examScheduleId, sectionId) => {
  // Get components
  const { rows: components } = await pool.query(
    `SELECT * FROM mark_components WHERE exam_schedule_id = $1 ORDER BY sort_order`,
    [examScheduleId]
  );

  // Get enrolled students
  const { rows: students } = await pool.query(
    `SELECT s.id, s.first_name, s.last_name, s.student_number, e.roll_number
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.section_id = $1
       AND e.enrollment_status = 'ACTIVE'
       AND e.academic_year_id = (
         SELECT academic_year_id FROM exam_schedules WHERE id = $2
       )
     ORDER BY e.roll_number, s.last_name`,
    [sectionId, examScheduleId]
  );

  // Get existing marks
  const { rows: marks } = await pool.query(
    `SELECT sm.*, mc.name AS component_name, mc.max_marks
     FROM student_marks sm
     JOIN mark_components mc ON mc.id = sm.mark_component_id
     WHERE mc.exam_schedule_id = $1`,
    [examScheduleId]
  );

  // Build map: student_id → component_id → mark
  const markMap = {};
  marks.forEach(m => {
    if (!markMap[m.student_id]) markMap[m.student_id] = {};
    markMap[m.student_id][m.mark_component_id] = m;
  });

  return {
    components,
    students: students.map(s => ({
      ...s,
      marks: components.map(c => markMap[s.id]?.[c.id] || null),
    })),
  };
};

/**
 * Bulk save marks for a student on one exam
 * marks: [{ mark_component_id, marks_obtained, is_absent, teacher_remarks }]
 */
const saveStudentMarks = async (userId, studentId, marks) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const m of marks) {
      await client.query(
        `INSERT INTO student_marks
           (mark_component_id, student_id, marks_obtained, is_absent, teacher_remarks, entered_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (mark_component_id, student_id)
         DO UPDATE SET
           marks_obtained  = EXCLUDED.marks_obtained,
           is_absent       = EXCLUDED.is_absent,
           teacher_remarks = EXCLUDED.teacher_remarks,
           entered_by      = EXCLUDED.entered_by,
           updated_at      = NOW()`,
        [m.mark_component_id, studentId,
         m.is_absent ? null : m.marks_obtained,
         m.is_absent || false,
         m.teacher_remarks || null, userId]
      );
    }
    await client.query('COMMIT');
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

// ═════════════════════════════════════════════════════════════════════════════
// REPORT CARD GENERATION
// Calculates per-subject totals, percentages, grades, ranks then stores
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Lookup grade from grading_scales by percentage
 */
const lookupGrade = async (client, pct) => {
  const { rows } = await client.query(
    `SELECT name, is_pass FROM grading_scales
     WHERE $1 >= min_percentage AND $1 <= max_percentage
     LIMIT 1`,
    [pct]
  );
  return rows[0] || { name: 'F', is_pass: false };
};

/**
 * Generate report card for one student in a given term.
 * Can be called per-student or in bulk (generateReportCardsForSection).
 */
const generateReportCard = async (userId, studentId, termId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get enrollment
    const { rows: enr } = await client.query(
      `SELECT e.id, e.section_id, e.class_id, e.academic_year_id
       FROM enrollments e
       JOIN terms t ON t.academic_year_id = e.academic_year_id
       WHERE e.student_id = $1 AND t.id = $2 AND e.enrollment_status = 'ACTIVE'
       LIMIT 1`,
      [studentId, termId]
    );
    if (!enr.length) throw Object.assign(new Error('No active enrollment for this student/term.'), { status: 404 });
    const enrollment = enr[0];

    // Get all exam schedules for this student's section this term
    const { rows: exams } = await client.query(
      `SELECT es.id, es.curriculum_subject_id,
              cs.max_mark AS subject_max_mark, cs.pass_mark
       FROM exam_schedules es
       JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
       WHERE es.term_id = $1 AND es.section_id = $2`,
      [termId, enrollment.section_id]
    );

    // Calculate per-subject totals from mark_components + student_marks
    const subjectResults = [];
    let grandTotal = 0;
    let grandMax   = 0;

    for (const exam of exams) {
      const { rows: components } = await client.query(
        `SELECT mc.id, mc.max_marks FROM mark_components mc WHERE mc.exam_schedule_id = $1`,
        [exam.id]
      );
      if (!components.length) continue;

      const componentIds = components.map(c => c.id);
      const { rows: marks } = await client.query(
        `SELECT sm.mark_component_id, sm.marks_obtained, sm.is_absent
         FROM student_marks sm
         WHERE sm.student_id = $1 AND sm.mark_component_id = ANY($2::uuid[])`,
        [studentId, componentIds]
      );

      const totalMax = components.reduce((s, c) => s + parseFloat(c.max_marks), 0);
      let   obtained = 0;
      let   allEntered = marks.length === components.length;

      marks.forEach(m => {
        if (!m.is_absent && m.marks_obtained != null)
          obtained += parseFloat(m.marks_obtained);
      });

      if (!allEntered) continue; // skip subjects with missing marks

      const subjectPct   = totalMax > 0 ? Math.round((obtained / totalMax) * 100 * 100) / 100 : 0;
      const grade        = await lookupGrade(client, subjectPct);
      const scaledMarks  = exam.subject_max_mark
        ? (obtained / totalMax) * parseFloat(exam.subject_max_mark)
        : obtained;

      subjectResults.push({
        curriculum_subject_id: exam.curriculum_subject_id,
        total_marks:   Math.round(scaledMarks * 100) / 100,
        percentage:    subjectPct,
        letter_grade:  grade.name,
        is_passed:     grade.is_pass,
        pass_mark:     exam.pass_mark,
        max_mark:      exam.subject_max_mark,
      });

      grandTotal += scaledMarks;
      grandMax   += parseFloat(exam.subject_max_mark || totalMax);
    }

    if (!subjectResults.length) {
      throw Object.assign(new Error('No completed mark entries found for this student/term.'), { status: 422 });
    }

    const overallPct   = grandMax > 0 ? Math.round((grandTotal / grandMax) * 100 * 100) / 100 : 0;
    const overallGrade = await lookupGrade(client, overallPct);

    // Upsert report card header
    const { rows: rc } = await client.query(
      `INSERT INTO report_cards
         (student_id, term_id, enrollment_id, total_marks, total_percentage,
          overall_grade, is_published, generated_by)
       VALUES ($1,$2,$3,$4,$5,$6,FALSE,$7)
       ON CONFLICT (student_id, term_id)
       DO UPDATE SET
         total_marks      = EXCLUDED.total_marks,
         total_percentage = EXCLUDED.total_percentage,
         overall_grade    = EXCLUDED.overall_grade,
         generated_by     = EXCLUDED.generated_by,
         updated_at       = NOW()
       RETURNING id`,
      [studentId, termId, enrollment.id,
       Math.round(grandTotal * 100) / 100, overallPct,
       overallGrade.name, userId]
    );
    const reportCardId = rc[0].id;

    // Upsert per-subject items
    for (const sr of subjectResults) {
      await client.query(
        `INSERT INTO report_card_items
           (report_card_id, curriculum_subject_id, total_marks, percentage, letter_grade, is_passed)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (report_card_id, curriculum_subject_id)
         DO UPDATE SET
           total_marks  = EXCLUDED.total_marks,
           percentage   = EXCLUDED.percentage,
           letter_grade = EXCLUDED.letter_grade,
           is_passed    = EXCLUDED.is_passed,
           updated_at   = NOW()`,
        [reportCardId, sr.curriculum_subject_id,
         sr.total_marks, sr.percentage, sr.letter_grade, sr.is_passed]
      );
    }

    await client.query('COMMIT');
    return { report_card_id: reportCardId, overall_percentage: overallPct, overall_grade: overallGrade.name, subjects: subjectResults.length };
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

/**
 * Generate report cards for all students in a section for a term,
 * then calculate class ranks.
 */
const generateReportCardsForSection = async (userId, termId, sectionId) => {
  // Get all enrolled students
  const { rows: students } = await pool.query(
    `SELECT s.id FROM enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.section_id = $1 AND e.enrollment_status = 'ACTIVE'
       AND e.academic_year_id = (SELECT academic_year_id FROM terms WHERE id = $2)`,
    [sectionId, termId]
  );

  const results = { success: [], failed: [] };
  for (const stu of students) {
    try {
      const r = await generateReportCard(userId, stu.id, termId);
      results.success.push({ student_id: stu.id, ...r });
    } catch (err) {
      results.failed.push({ student_id: stu.id, reason: err.message });
    }
  }

  // Update class ranks (rank by total_percentage DESC)
  if (results.success.length) {
    await pool.query(
      `UPDATE report_cards rc
       SET class_rank = sub.rank, updated_at = NOW()
       FROM (
         SELECT id,
                RANK() OVER (ORDER BY total_percentage DESC NULLS LAST) AS rank
         FROM report_cards
         WHERE term_id = $1
           AND student_id IN (
             SELECT student_id FROM enrollments
             WHERE section_id = $2 AND enrollment_status = 'ACTIVE'
           )
       ) sub
       WHERE rc.id = sub.id`,
      [termId, sectionId]
    );
  }

  return results;
};

/**
 * Publish / unpublish a report card
 */
const setReportCardPublished = async (reportCardId, published) => {
  const { rows } = await pool.query(
    `UPDATE report_cards
     SET is_published = $1,
         published_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
         updated_at   = NOW()
     WHERE id = $2 RETURNING *`,
    [published, reportCardId]
  );
  return rows[0] || null;
};

/**
 * Add teacher/advisor remarks to a report card item
 */
const addTeacherRemarks = async (userId, reportCardId, curriculumSubjectId, remarks) => {
  const { rows: teacher } = await pool.query(
    `SELECT id FROM teachers WHERE user_id = $1`, [userId]
  );
  const teacherId = teacher[0]?.id || null;

  const { rows } = await pool.query(
    `UPDATE report_card_items
     SET teacher_remarks = $1, teacher_id = $2, updated_at = NOW()
     WHERE report_card_id = $3 AND curriculum_subject_id = $4
     RETURNING *`,
    [remarks, teacherId, reportCardId, curriculumSubjectId]
  );
  return rows[0] || null;
};

/**
 * Get full report card with items (used by teacher/principal view)
 */
const getReportCard = async (reportCardId) => {
  const { rows: header } = await pool.query(
    `SELECT rc.*, s.first_name, s.last_name, s.student_number,
            t.name AS term_name, ay.name AS academic_year,
            c.name AS class_name, sec.name AS section_name
     FROM report_cards rc
     JOIN students      s   ON s.id   = rc.student_id
     JOIN terms         t   ON t.id   = rc.term_id
     JOIN academic_years ay ON ay.id  = t.academic_year_id
     JOIN enrollments   e   ON e.id   = rc.enrollment_id
     JOIN classes       c   ON c.id   = e.class_id
     JOIN sections      sec ON sec.id = e.section_id
     WHERE rc.id = $1`,
    [reportCardId]
  );
  if (!header.length) return null;

  const { rows: items } = await pool.query(
    `SELECT rci.*,
            sub.name AS subject_name, sub.code AS subject_code,
            (te.first_name || ' ' || te.last_name) AS teacher_name
     FROM report_card_items rci
     JOIN curriculum_subjects cs ON cs.id = rci.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     LEFT JOIN teachers te ON te.id = rci.teacher_id
     WHERE rci.report_card_id = $1
     ORDER BY sub.name`,
    [reportCardId]
  );

  return { ...header[0], items };
};

/**
 * List report cards for a section/term (teacher/principal overview)
 */
const listReportCards = async ({ term_id, section_id, is_published }) => {
  const conds = ['1=1'];
  const vals  = [];
  let   p     = 1;
  if (term_id)      { conds.push(`rc.term_id = $${p++}`);     vals.push(term_id); }
  if (section_id)   { conds.push(`e.section_id = $${p++}`);   vals.push(section_id); }
  if (is_published !== undefined) { conds.push(`rc.is_published = $${p++}`); vals.push(is_published); }

  const { rows } = await pool.query(
    `SELECT rc.id, rc.total_percentage, rc.overall_grade, rc.class_rank,
            rc.is_published, rc.published_at,
            s.first_name, s.last_name, s.student_number,
            e.roll_number
     FROM report_cards rc
     JOIN students    s ON s.id = rc.student_id
     JOIN enrollments e ON e.id = rc.enrollment_id
     WHERE ${conds.join(' AND ')}
     ORDER BY rc.class_rank NULLS LAST, s.last_name`,
    vals
  );
  return rows;
};

module.exports = {
  getExamSchedules, createExamSchedule, updateExamSchedule, deleteExamSchedule,
  getMarkComponents, upsertMarkComponents,
  getExamMarkSheet, saveStudentMarks,
  generateReportCard, generateReportCardsForSection,
  setReportCardPublished, addTeacherRemarks,
  getReportCard, listReportCards,
};
