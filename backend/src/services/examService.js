const pool = require('../db');

// ═════════════════════════════════════════════════════════════════════════════
// EXAM SCHEDULES
// ═════════════════════════════════════════════════════════════════════════════

const getExamSchedules = async ({
  class_id,
  section_id,
  teacher_id,
  academic_year_id,
  term_id,
  is_published,
} = {}) => {
  const conditions = ['1=1'];
  const params = [];
  let p = 1;

  if (academic_year_id) {
    conditions.push(`es.academic_year_id = $${p++}`);
    params.push(academic_year_id);
  }
  if (term_id) {
    conditions.push(`es.term_id = $${p++}`);
    params.push(term_id);
  }
  if (class_id) {
    conditions.push(`es.class_id = $${p++}`);
    params.push(class_id);
  }
  if (section_id) {
    conditions.push(`es.section_id = $${p++}`);
    params.push(section_id);
  }
  if (is_published !== undefined) {
    conditions.push(`es.is_published = $${p++}`);
    params.push(is_published);
  }
  if (teacher_id) {
    // If teacher provided, filter to subjects the teacher is assigned in timetables or curriculum
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM timetables t
        WHERE t.curriculum_subject_id = es.curriculum_subject_id
          AND t.teacher_id = $${p}
      ) OR EXISTS (
        SELECT 1 FROM class_advisors ca
        WHERE ca.class_id = es.class_id
          AND ca.section_id = es.section_id
          AND ca.teacher_id = $${p}
      )
    )`);
    params.push(teacher_id);
    p++;
  }

  const { rows } = await pool.query(
    `SELECT
       es.*,
       c.name   AS class_name,
       s.name   AS section_name,
       sub.name AS subject_name,
       sub.code AS subject_code,
       t.name   AS term_name,
       ay.name  AS academic_year_name
     FROM exam_schedules es
     JOIN classes c ON c.id = es.class_id
     JOIN sections s ON s.id = es.section_id
     JOIN terms t ON t.id = es.term_id
     JOIN academic_years ay ON ay.id = es.academic_year_id
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY es.exam_date ASC, es.start_time ASC`,
    params
  );
  return rows;
};

const getExamScheduleById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       es.*,
       c.name   AS class_name,
       s.name   AS section_name,
       sub.name AS subject_name,
       sub.code AS subject_code,
       t.name   AS term_name,
       ay.name  AS academic_year_name
     FROM exam_schedules es
     JOIN classes c ON c.id = es.class_id
     JOIN sections s ON s.id = es.section_id
     JOIN terms t ON t.id = es.term_id
     JOIN academic_years ay ON ay.id = es.academic_year_id
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE es.id = $1`,
    [id]
  );
  return rows[0] || null;
};

const createExamSchedule = async (fields, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO exam_schedules (
       academic_year_id, term_id, class_id, section_id,
       curriculum_subject_id, title, exam_date,
       start_time, end_time, venue, notes, is_published, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      fields.academic_year_id,
      fields.term_id,
      fields.class_id,
      fields.section_id,
      fields.curriculum_subject_id,
      fields.title,
      fields.exam_date,
      fields.start_time || null,
      fields.end_time || null,
      fields.venue || null,
      fields.notes || null,
      fields.is_published !== undefined ? fields.is_published : false,
      userId,
    ]
  );
  return rows[0];
};

const updateExamSchedule = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE exam_schedules
     SET title                 = COALESCE($1, title),
         exam_date             = COALESCE($2, exam_date),
         start_time            = COALESCE($3, start_time),
         end_time              = COALESCE($4, end_time),
         venue                 = COALESCE($5, venue),
         notes                 = COALESCE($6, notes),
         is_published          = COALESCE($7, is_published),
         curriculum_subject_id = COALESCE($8, curriculum_subject_id),
         updated_at            = NOW()
     WHERE id = $9
     RETURNING *`,
    [
      fields.title,
      fields.exam_date,
      fields.start_time,
      fields.end_time,
      fields.venue,
      fields.notes,
      fields.is_published,
      fields.curriculum_subject_id,
      id,
    ]
  );
  return rows[0] || null;
};

const deleteExamSchedule = async (id) => {
  await pool.query(`DELETE FROM exam_schedules WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// MARK COMPONENTS & MARKSHEET
// ═════════════════════════════════════════════════════════════════════════════

const getComponents = async (examScheduleId) => {
  let { rows } = await pool.query(
    `SELECT id, exam_schedule_id, name, max_marks, sort_order
     FROM mark_components
     WHERE exam_schedule_id = $1
     ORDER BY sort_order ASC, created_at ASC`,
    [examScheduleId]
  );

  // If no components exist, seed default breakdown (Assignment: 10, Mid Exam: 40, Final Exam: 50)
  if (rows.length === 0) {
    const defaults = [
      { name: 'Assignment', max_marks: 10, sort_order: 0 },
      { name: 'Mid Exam',   max_marks: 40, sort_order: 1 },
      { name: 'Final Exam', max_marks: 50, sort_order: 2 },
    ];
    for (const d of defaults) {
      const { rows: created } = await pool.query(
        `INSERT INTO mark_components (exam_schedule_id, name, max_marks, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, exam_schedule_id, name, max_marks, sort_order`,
        [examScheduleId, d.name, d.max_marks, d.sort_order]
      );
      rows.push(created[0]);
    }
  }

  return rows;
};

const saveComponents = async (examScheduleId, components) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM mark_components WHERE exam_schedule_id = $1', [examScheduleId]);
    for (let i = 0; i < components.length; i++) {
      const c = components[i];
      await client.query(
        `INSERT INTO mark_components (exam_schedule_id, name, max_marks, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [examScheduleId, c.name, parseFloat(c.max_marks) || 0, c.sort_order ?? i]
      );
    }
    await client.query('COMMIT');
    return getComponents(examScheduleId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getMarkSheet = async (examId, sectionId) => {
  const schedule = await getExamScheduleById(examId);
  if (!schedule) {
    const err = new Error('Exam schedule not found.');
    err.status = 404;
    throw err;
  }

  const effectiveSectionId = sectionId || schedule.section_id;
  const components = await getComponents(examId);

  // Retrieve enrolled students in the section
  const { rows: students } = await pool.query(
    `SELECT
       s.id,
       s.id AS student_id,
       s.admission_number,
       s.first_name,
       s.last_name,
       e.roll_number
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.class_id = $1
       AND e.section_id = $2
       AND e.enrollment_status = 'ACTIVE'
     ORDER BY e.roll_number, s.last_name, s.first_name`,
    [schedule.class_id, effectiveSectionId]
  );

  // Retrieve marks for all students in these components
  const compIds = components.map(c => c.id);
  let marksMap = {};
  if (compIds.length > 0 && students.length > 0) {
    const { rows: sm } = await pool.query(
      `SELECT student_id, mark_component_id, marks_obtained, is_absent, teacher_remarks
       FROM student_marks
       WHERE mark_component_id = ANY($1::uuid[])`,
      [compIds]
    );
    for (const row of sm) {
      if (!marksMap[row.student_id]) marksMap[row.student_id] = {};
      marksMap[row.student_id][row.mark_component_id] = row;
    }
  }

  // Format each student with their marks array corresponding to components
  const mappedStudents = students.map(stu => ({
    ...stu,
    marks: components.map(comp => {
      const entry = marksMap[stu.id]?.[comp.id];
      return {
        mark_component_id: comp.id,
        marks_obtained: entry ? (entry.marks_obtained !== null ? parseFloat(entry.marks_obtained) : '') : '',
        is_absent: entry?.is_absent ?? false,
      };
    }),
  }));

  return {
    exam: schedule,
    components,
    students: mappedStudents,
  };
};

const saveMarks = async (examId, studentId, marksData, enteredBy = null) => {
  const schedule = await getExamScheduleById(examId);
  if (!schedule) {
    const err = new Error('Exam schedule not found.');
    err.status = 404;
    throw err;
  }

  const marksList = Array.isArray(marksData) ? marksData : (marksData.marks ? marksData.marks : [marksData]);

  for (const m of marksList) {
    if (!m.mark_component_id) continue;
    const isAbsent = Boolean(m.is_absent);
    const marksObtained = isAbsent ? null : (parseFloat(m.marks_obtained) || 0);

    await pool.query(
      `INSERT INTO student_marks (
         mark_component_id, student_id, marks_obtained, is_absent, entered_by, updated_at
       ) VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (mark_component_id, student_id)
       DO UPDATE SET
         marks_obtained = EXCLUDED.marks_obtained,
         is_absent      = EXCLUDED.is_absent,
         entered_by     = EXCLUDED.entered_by,
         updated_at     = NOW()`,
      [m.mark_component_id, studentId, marksObtained, isAbsent, enteredBy]
    );
  }

  // Calculate and sync student's overall score to report_card_items if report_card exists
  try {
    const components = await getComponents(examId);
    const compIds = components.map(c => c.id);
    const { rows: allMarks } = await pool.query(
      `SELECT marks_obtained, is_absent FROM student_marks
       WHERE student_id = $1 AND mark_component_id = ANY($2::uuid[])`,
      [studentId, compIds]
    );

    const totalObtained = allMarks.reduce((acc, cur) => acc + (cur.is_absent ? 0 : (parseFloat(cur.marks_obtained) || 0)), 0);
    const maxTotal = components.reduce((acc, cur) => acc + (parseFloat(cur.max_marks) || 0), 0) || 100;
    const percentage = maxTotal > 0 ? (totalObtained / maxTotal) * 100 : 0;

    let { rows: scaleRows } = await pool.query(
      `SELECT grade FROM grading_scales
       WHERE min_percentage <= $1 AND max_percentage >= $1
       ORDER BY min_percentage DESC LIMIT 1`,
      [percentage]
    );
    const grade = scaleRows[0]?.grade || (percentage >= 50 ? 'P' : 'F');

    // Check report_card
    const { rows: cardRows } = await pool.query(
      `SELECT id FROM report_cards WHERE student_id = $1 AND term_id = $2`,
      [studentId, schedule.term_id]
    );

    if (cardRows.length > 0) {
      await pool.query(
        `INSERT INTO report_card_items (
           report_card_id, curriculum_subject_id, total_marks, percentage, letter_grade, is_passed, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (report_card_id, curriculum_subject_id)
         DO UPDATE SET
           total_marks  = EXCLUDED.total_marks,
           percentage   = EXCLUDED.percentage,
           letter_grade = EXCLUDED.letter_grade,
           is_passed    = EXCLUDED.is_passed,
           updated_at   = NOW()`,
        [cardRows[0].id, schedule.curriculum_subject_id, totalObtained, percentage, grade, percentage >= 50]
      );
    }
  } catch (syncErr) {
    console.error('[examService] report_card_items sync error:', syncErr.message);
  }

  return { success: true };
};

// ═════════════════════════════════════════════════════════════════════════════
// REPORT CARDS
// ═════════════════════════════════════════════════════════════════════════════

const listReportCards = async ({
  academic_year_id,
  term_id,
  class_id,
  section_id,
  is_published,
} = {}) => {
  const conditions = ['1=1'];
  const params = [];
  let p = 1;

  if (term_id) {
    conditions.push(`rc.term_id = $${p++}`);
    params.push(term_id);
  }
  if (is_published !== undefined) {
    conditions.push(`rc.is_published = $${p++}`);
    params.push(is_published);
  }
  if (class_id) {
    conditions.push(`e.class_id = $${p++}`);
    params.push(class_id);
  }
  if (section_id) {
    conditions.push(`e.section_id = $${p++}`);
    params.push(section_id);
  }
  if (academic_year_id) {
    conditions.push(`e.academic_year_id = $${p++}`);
    params.push(academic_year_id);
  }

  const { rows } = await pool.query(
    `SELECT
       rc.*,
       s.student_number,
       s.admission_number,
       s.first_name,
       s.last_name,
       c.name AS class_name,
       sec.name AS section_name,
       t.name AS term_name,
       ay.name AS academic_year_name
     FROM report_cards rc
     JOIN students s ON s.id = rc.student_id
     JOIN enrollments e ON e.id = rc.enrollment_id
     JOIN classes c ON c.id = e.class_id
     JOIN sections sec ON sec.id = e.section_id
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY s.last_name, s.first_name`,
    params
  );
  return rows;
};

const getReportCard = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       rc.*,
       s.student_number,
       s.admission_number,
       s.first_name,
       s.last_name,
       c.name AS class_name,
       sec.name AS section_name,
       t.name AS term_name,
       ay.name AS academic_year
     FROM report_cards rc
     JOIN students s ON s.id = rc.student_id
     JOIN enrollments e ON e.id = rc.enrollment_id
     JOIN classes c ON c.id = e.class_id
     JOIN sections sec ON sec.id = e.section_id
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE rc.id = $1`,
    [id]
  );

  if (!rows.length) return null;
  const card = rows[0];

  const { rows: items } = await pool.query(
    `SELECT
       rci.*,
       sub.name AS subject_name,
       sub.code AS subject_code
     FROM report_card_items rci
     JOIN curriculum_subjects cs ON cs.id = rci.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE rci.report_card_id = $1
     ORDER BY sub.name ASC`,
    [id]
  );

  card.items = items;
  return card;
};

const generateReportCard = async ({ student_id, term_id }) => {
  const { rows: enrollRows } = await pool.query(
    `SELECT e.id
     FROM enrollments e
     JOIN terms t ON t.academic_year_id = e.academic_year_id
     WHERE e.student_id = $1 AND t.id = $2 AND e.enrollment_status = 'ACTIVE'
     LIMIT 1`,
    [student_id, term_id]
  );

  const enrollmentId = enrollRows[0]?.id;
  if (!enrollmentId) {
    const err = new Error('Student is not actively enrolled for this term.');
    err.status = 400;
    throw err;
  }

  // Check existing card
  const { rows: existing } = await pool.query(
    `SELECT id FROM report_cards WHERE student_id = $1 AND term_id = $2`,
    [student_id, term_id]
  );

  let cardId;
  if (existing.length) {
    cardId = existing[0].id;
  } else {
    const { rows: created } = await pool.query(
      `INSERT INTO report_cards (student_id, term_id, enrollment_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [student_id, term_id, enrollmentId]
    );
    cardId = created[0].id;
  }

  // Recalculate summary metrics from items
  const { rows: sumRows } = await pool.query(
    `SELECT
       COALESCE(SUM(total_marks), 0) AS total_marks,
       COALESCE(AVG(percentage), 0)  AS total_percentage
     FROM report_card_items
     WHERE report_card_id = $1`,
    [cardId]
  );

  const totalMarks = parseFloat(sumRows[0]?.total_marks || 0);
  const totalPercentage = parseFloat(sumRows[0]?.total_percentage || 0);

  // Determine grade from scales
  const { rows: gradeRows } = await pool.query(
    `SELECT grade FROM grading_scales
     WHERE min_percentage <= $1 AND max_percentage >= $1
     ORDER BY min_percentage DESC LIMIT 1`,
    [totalPercentage]
  );
  const overallGrade = gradeRows[0]?.grade || (totalPercentage >= 50 ? 'P' : 'F');

  const { rows: updated } = await pool.query(
    `UPDATE report_cards
     SET total_marks      = $1,
         total_percentage = $2,
         overall_grade    = $3,
         updated_at       = NOW()
     WHERE id = $4
     RETURNING *`,
    [totalMarks, totalPercentage, overallGrade, cardId]
  );

  return updated[0];
};

const generateSectionCards = async ({ class_id, section_id, term_id }) => {
  const { rows: enrollments } = await pool.query(
    `SELECT student_id FROM enrollments
     WHERE class_id = $1 AND section_id = $2 AND enrollment_status = 'ACTIVE'`,
    [class_id, section_id]
  );

  const generated = [];
  for (const en of enrollments) {
    try {
      const card = await generateReportCard({ student_id: en.student_id, term_id });
      generated.push(card);
    } catch (_) {}
  }
  return { count: generated.length, cards: generated };
};

const publishReportCard = async (id, isPublished) => {
  const { rows } = await pool.query(
    `UPDATE report_cards
     SET is_published = $1,
         published_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
         updated_at   = NOW()
     WHERE id = $2
     RETURNING *`,
    [Boolean(isPublished), id]
  );
  return rows[0] || null;
};

const addRemarks = async (id, subjectId, remarks) => {
  if (subjectId && subjectId !== 'general') {
    const { rows } = await pool.query(
      `UPDATE report_card_items
       SET teacher_remarks = $1,
           updated_at      = NOW()
       WHERE report_card_id = $2 AND curriculum_subject_id = $3
       RETURNING *`,
      [remarks, id, subjectId]
    );
    return rows[0] || null;
  }

  const { rows } = await pool.query(
    `UPDATE report_cards
     SET advisor_remarks = $1,
         updated_at      = NOW()
     WHERE id = $2
     RETURNING *`,
    [remarks, id]
  );
  return rows[0] || null;
};

module.exports = {
  getExamSchedules,
  getExamScheduleById,
  createExamSchedule,
  updateExamSchedule,
  deleteExamSchedule,
  getComponents,
  saveComponents,
  getMarkSheet,
  saveMarks,
  listReportCards,
  getReportCard,
  generateReportCard,
  generateSectionCards,
  publishReportCard,
  addRemarks,
};
