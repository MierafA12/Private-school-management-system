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
// MARKSHEET & MARKS SUBMISSION
// ═════════════════════════════════════════════════════════════════════════════

const getMarkSheet = async (examId, sectionId) => {
  const schedule = await getExamScheduleById(examId);
  if (!schedule) {
    const err = new Error('Exam schedule not found.');
    err.status = 404;
    throw err;
  }

  const effectiveSectionId = sectionId || schedule.section_id;

  // Retrieve enrolled students in the section
  const { rows: students } = await pool.query(
    `SELECT
       s.id AS student_id,
       s.student_number,
       s.first_name,
       s.last_name,
       e.roll_number,
       rc.id AS report_card_id,
       rci.marks_obtained,
       rci.max_marks,
       rci.percentage,
       rci.grade,
       rci.remarks
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     LEFT JOIN report_cards rc
       ON rc.student_id = s.id
      AND rc.term_id = $1
     LEFT JOIN report_card_items rci
       ON rci.report_card_id = rc.id
      AND rci.curriculum_subject_id = $2
     WHERE e.class_id = $3
       AND e.section_id = $4
       AND e.enrollment_status = 'ACTIVE'
     ORDER BY e.roll_number, s.last_name, s.first_name`,
    [
      schedule.term_id,
      schedule.curriculum_subject_id,
      schedule.class_id,
      effectiveSectionId,
    ]
  );

  return {
    exam: schedule,
    students,
  };
};

const saveMarks = async (examId, studentId, marksData) => {
  const schedule = await getExamScheduleById(examId);
  if (!schedule) {
    const err = new Error('Exam schedule not found.');
    err.status = 404;
    throw err;
  }

  // Ensure report_card exists for this student and term
  const { rows: enrollRows } = await pool.query(
    `SELECT id FROM enrollments
     WHERE student_id = $1
       AND academic_year_id = $2
       AND enrollment_status = 'ACTIVE'
     LIMIT 1`,
    [studentId, schedule.academic_year_id]
  );

  const enrollmentId = enrollRows[0]?.id;
  if (!enrollmentId) {
    const err = new Error('Active enrollment not found for student.');
    err.status = 400;
    throw err;
  }

  let { rows: cardRows } = await pool.query(
    `SELECT id FROM report_cards WHERE student_id = $1 AND term_id = $2`,
    [studentId, schedule.term_id]
  );

  let reportCardId = cardRows[0]?.id;
  if (!reportCardId) {
    const { rows: newCard } = await pool.query(
      `INSERT INTO report_cards (student_id, term_id, enrollment_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [studentId, schedule.term_id, enrollmentId]
    );
    reportCardId = newCard[0].id;
  }

  const marksObtained = parseFloat(marksData.marks_obtained ?? marksData.marks ?? 0);
  const maxMarks = parseFloat(marksData.max_marks || 100);
  const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;

  // Derive grade from grading scale if available
  let grade = marksData.grade || null;
  if (!grade) {
    const { rows: scaleRows } = await pool.query(
      `SELECT grade FROM grading_scales
       WHERE min_percentage <= $1 AND max_percentage >= $1
       ORDER BY min_percentage DESC LIMIT 1`,
      [percentage]
    );
    grade = scaleRows[0]?.grade || (percentage >= 50 ? 'P' : 'F');
  }

  // Upsert report_card_items
  const { rows } = await pool.query(
    `INSERT INTO report_card_items (
       report_card_id, curriculum_subject_id, marks_obtained, max_marks, percentage, grade, remarks
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (report_card_id, curriculum_subject_id)
     DO UPDATE SET
       marks_obtained = EXCLUDED.marks_obtained,
       max_marks      = EXCLUDED.max_marks,
       percentage     = EXCLUDED.percentage,
       grade          = EXCLUDED.grade,
       remarks        = EXCLUDED.remarks,
       updated_at     = NOW()
     RETURNING *`,
    [
      reportCardId,
      schedule.curriculum_subject_id,
      marksObtained,
      maxMarks,
      percentage,
      grade,
      marksData.remarks || null,
    ]
  );

  return rows[0];
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
       COALESCE(SUM(marks_obtained), 0) AS total_marks,
       COALESCE(AVG(percentage), 0)     AS total_percentage
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
       SET remarks    = $1,
           updated_at = NOW()
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
  getMarkSheet,
  saveMarks,
  listReportCards,
  getReportCard,
  generateReportCard,
  generateSectionCards,
  publishReportCard,
  addRemarks,
};
