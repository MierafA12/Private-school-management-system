const pool = require('../db');

// Helper to get teacher_id from user_id
const getTeacherId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT id FROM teachers WHERE user_id = $1`,
    [userId]
  );
  if (!rows.length) {
    const err = new Error('Teacher profile not found.');
    err.status = 404;
    throw err;
  }
  return rows[0].id;
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

const getDashboardStats = async (userId) => {
  const teacherId = await getTeacherId(userId);

  // Today's classes for the teacher
  const { rows: classesToday } = await pool.query(
    `SELECT
       t.id as timetable_id,
       t.day_of_week,
       t.period_number,
       t.room_number as room_id,
       c.name AS class_name,
       sec.name AS section_name,
       sub.name AS subject_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE t.teacher_id = $1
       AND t.day_of_week = TRIM(TO_CHAR(CURRENT_DATE, 'Day'))
     ORDER BY t.period_number ASC`,
    [teacherId]
  );

  // Number of assigned classes (advisor + taught subjects)
  const { rows: assignedCount } = await pool.query(
    `SELECT COUNT(DISTINCT class_id) AS total
     FROM timetables
     WHERE teacher_id = $1`,
    [teacherId]
  );

  return {
    classesToday,
    assignedClassCount: parseInt(assignedCount[0]?.total || 0, 10),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE
// ─────────────────────────────────────────────────────────────────────────────

const getTimetable = async (userId) => {
  const teacherId = await getTeacherId(userId);

  const { rows } = await pool.query(
    `SELECT
       t.id, t.day_of_week, t.period_number,
       c.name AS class_name,
       sec.name AS section_name,
       sub.name AS subject_name,
       t.room_number
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE t.teacher_id = $1
     ORDER BY
       array_position(ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], t.day_of_week),
       t.period_number`,
    [teacherId]
  );

  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// CLASSES
// ─────────────────────────────────────────────────────────────────────────────

const getClasses = async (userId) => {
  const teacherId = await getTeacherId(userId);

  const { rows } = await pool.query(
    `SELECT DISTINCT
       c.id AS class_id, c.name AS class_name,
       sec.id AS section_id, sec.name AS section_name,
       sub.id AS subject_id, sub.name AS subject_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     WHERE t.teacher_id = $1
     ORDER BY c.name, sec.name, sub.name`,
    [teacherId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

const getAttendance = async (userId, classId, sectionId, date) => {
  const teacherId = await getTeacherId(userId);

  // Check if session exists
  let { rows: sessions } = await pool.query(
    `SELECT id FROM attendance_sessions
     WHERE class_id = $1 AND section_id = $2 AND attendance_date = $3 AND attendance_type = 'DAILY'`,
    [classId, sectionId, date]
  );

  let sessionId = null;
  let records = [];

  if (sessions.length > 0) {
    sessionId = sessions[0].id;
    const { rows } = await pool.query(
      `SELECT
         r.id, r.student_id, r.attendance_status, r.remarks,
         s.first_name, s.last_name, s.admission_number
       FROM attendance_records r
       JOIN students s ON s.id = r.student_id
       WHERE r.attendance_session_id = $1
       ORDER BY s.last_name, s.first_name`,
      [sessionId]
    );
    records = rows;
  } else {
    // Return student list from active enrollments
    const { rows } = await pool.query(
      `SELECT
         s.id AS student_id, s.first_name, s.last_name, s.admission_number
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE e.class_id = $1 AND e.section_id = $2 AND e.enrollment_status = 'ACTIVE'
       ORDER BY s.last_name, s.first_name`,
      [classId, sectionId]
    );
    records = rows.map(r => ({ ...r, attendance_status: 'Present', remarks: '' }));
  }

  return { sessionId, date, records };
};

const submitAttendance = async (userId, classId, sectionId, date, records) => {
  const teacherId = await getTeacherId(userId);
  let sessionId;

  // Check if session exists
  const { rows: sessions } = await pool.query(
    `SELECT id FROM attendance_sessions
     WHERE class_id = $1 AND section_id = $2 AND attendance_date = $3 AND attendance_type = 'DAILY'`,
    [classId, sectionId, date]
  );

  if (sessions.length > 0) {
    sessionId = sessions[0].id;
  } else {
    // Get active term & academic year
    const { rows: termRows } = await pool.query(
      `SELECT t.id AS term_id, t.academic_year_id
       FROM terms t
       JOIN academic_years ay ON ay.id = t.academic_year_id
       WHERE ay.is_current = TRUE AND t.status = 'ACTIVE'
       LIMIT 1`
    );

    let academicYearId = null;
    let termId = null;

    if (termRows.length > 0) {
      academicYearId = termRows[0].academic_year_id;
      termId = termRows[0].term_id;
    } else {
      const { rows: anyTerm } = await pool.query(`SELECT id, academic_year_id FROM terms LIMIT 1`);
      if (anyTerm.length > 0) {
        academicYearId = anyTerm[0].academic_year_id;
        termId = anyTerm[0].id;
      }
    }

    const { rows: newSession } = await pool.query(
      `INSERT INTO attendance_sessions
         (academic_year_id, term_id, class_id, section_id, attendance_date, attendance_type, teacher_id, created_by)
       VALUES ($1, $2, $3, $4, $5, 'DAILY', $6, $7)
       RETURNING id`,
      [academicYearId, termId, classId, sectionId, date, teacherId, userId]
    );
    sessionId = newSession[0].id;
  }

  // Delete existing records to replace
  await pool.query(`DELETE FROM attendance_records WHERE attendance_session_id = $1`, [sessionId]);

  const insertPromises = records.map(r => {
    return pool.query(
      `INSERT INTO attendance_records (attendance_session_id, student_id, attendance_status, remarks)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, r.student_id, r.attendance_status || 'Present', r.remarks || null]
    );
  });

  await Promise.all(insertPromises);
  return { success: true, sessionId };
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADES
// ─────────────────────────────────────────────────────────────────────────────

const getExamsAndGrades = async (userId, classId, sectionId, subjectId) => {
  const teacherId = await getTeacherId(userId);

  const { rows: schedules } = await pool.query(
    `SELECT
       e.id AS exam_schedule_id, e.exam_type, e.exam_date, e.max_marks,
       tr.name AS term_name, ac.name AS year_name
     FROM exam_schedules e
     JOIN terms tr ON tr.id = e.term_id
     JOIN academic_years ac ON ac.id = tr.academic_year_id
     JOIN curriculum_subjects cs ON cs.id = e.curriculum_subject_id
     WHERE e.class_id = $1 AND e.section_id = $2 AND cs.subject_id = $3
     ORDER BY e.exam_date DESC`,
    [classId, sectionId, subjectId]
  );

  return schedules;
};

const getExamResults = async (examScheduleId) => {
  const { rows: schedules } = await pool.query(
    `SELECT class_id, section_id FROM exam_schedules WHERE id = $1`,
    [examScheduleId]
  );
  if (!schedules.length) throw new Error('Exam schedule not found.');

  const classId = schedules[0].class_id;
  const sectionId = schedules[0].section_id;

  // Get enrolled students + any existing results
  const { rows: students } = await pool.query(
    `SELECT
       s.id AS student_id, s.first_name, s.last_name, s.admission_number,
       er.marks_obtained, er.remarks AS teacher_remarks
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     LEFT JOIN exam_results er ON er.student_id = s.id AND er.exam_schedule_id = $1
     WHERE e.class_id = $2 AND e.section_id = $3 AND e.enrollment_status = 'ACTIVE'
     ORDER BY s.last_name, s.first_name`,
    [examScheduleId, classId, sectionId]
  );

  return students;
};

const submitGrades = async (userId, examScheduleId, results) => {
  for (const r of results) {
    if (r.marks_obtained !== null && r.marks_obtained !== undefined && r.marks_obtained !== '') {
      await pool.query(
        `INSERT INTO exam_results (exam_schedule_id, student_id, marks_obtained, remarks, entered_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (exam_schedule_id, student_id)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained,
                       remarks = EXCLUDED.remarks,
                       entered_by = EXCLUDED.entered_by,
                       updated_at = NOW()`,
        [examScheduleId, r.student_id, r.marks_obtained, r.teacher_remarks || null, userId]
      );
    }
  }
  return { success: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const getAnnouncements = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT
       a.id, a.title, a.body, a.audience, a.priority, a.created_at, u.email
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_published = TRUE
       AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
       AND a.audience IN ('ALL', 'TEACHERS')
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

module.exports = {
  getDashboardStats,
  getTimetable,
  getClasses,
  getAttendance,
  submitAttendance,
  getExamsAndGrades,
  getExamResults,
  submitGrades,
  getAnnouncements
};
