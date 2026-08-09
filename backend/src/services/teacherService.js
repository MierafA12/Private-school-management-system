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
       t.room_id,
       c.class_name,
       cs.section_name,
       s.subject_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN class_sections cs ON cs.id = t.section_id
     JOIN curriculum_subjects s ON s.id = t.subject_id
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
       c.class_name, cs.section_name, s.subject_name,
       r.room_number
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN class_sections cs ON cs.id = t.section_id
     JOIN curriculum_subjects s ON s.id = t.subject_id
     LEFT JOIN rooms r ON r.id = t.room_id
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
       c.id AS class_id, c.class_name,
       cs.id AS section_id, cs.section_name,
       s.id AS subject_id, s.subject_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN class_sections cs ON cs.id = t.section_id
     JOIN curriculum_subjects s ON s.id = t.subject_id
     WHERE t.teacher_id = $1
     ORDER BY c.class_name, cs.section_name, s.subject_name`,
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
         u.first_name, u.last_name, s.admission_number
       FROM attendance_records r
       JOIN students s ON s.id = r.student_id
       JOIN users u ON u.id = s.user_id
       WHERE r.attendance_session_id = $1
       ORDER BY u.last_name, u.first_name`,
      [sessionId]
    );
    records = rows;
  } else {
    // Return student list for new attendance
    const { rows } = await pool.query(
      `SELECT
         s.id AS student_id, u.first_name, u.last_name, s.admission_number
       FROM students s
       JOIN users u ON u.id = s.user_id
       WHERE s.class_id = $1 AND s.section_id = $2 AND s.current_status = 'ACTIVE'
       ORDER BY u.last_name, u.first_name`,
      [classId, sectionId]
    );
    records = rows.map(r => ({ ...r, attendance_status: 'Present', remarks: '' }));
  }

  return { sessionId, date, records };
};

const submitAttendance = async (userId, classId, sectionId, date, records) => {
  const teacherId = await getTeacherId(userId);
  let sessionId;

  // UPSERT session
  const { rows: sessions } = await pool.query(
    `SELECT id FROM attendance_sessions
     WHERE class_id = $1 AND section_id = $2 AND attendance_date = $3 AND attendance_type = 'DAILY'`,
    [classId, sectionId, date]
  );

  if (sessions.length > 0) {
    sessionId = sessions[0].id;
  } else {
    const { rows: newSession } = await pool.query(
      `INSERT INTO attendance_sessions (class_id, section_id, attendance_date, attendance_type, recorded_by, teacher_id)
       VALUES ($1, $2, $3, 'DAILY', $4, $5) RETURNING id`,
      [classId, sectionId, date, userId, teacherId]
    );
    sessionId = newSession[0].id;
  }

  // UPSERT records
  // Delete existing records to replace them easily, or upsert. Deleting is simpler for this scope.
  await pool.query(`DELETE FROM attendance_records WHERE attendance_session_id = $1`, [sessionId]);

  const insertPromises = records.map(r => {
    return pool.query(
      `INSERT INTO attendance_records (attendance_session_id, student_id, attendance_status, remarks)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, r.student_id, r.attendance_status, r.remarks || null]
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

  // Ensure they teach this
  const { rows: verify } = await pool.query(
    `SELECT 1 FROM timetables WHERE teacher_id = $1 AND class_id = $2 AND section_id = $3 AND subject_id = $4 LIMIT 1`,
    [teacherId, classId, sectionId, subjectId]
  );
  if (!verify.length) throw new Error('Not authorized for this subject/class.');

  const { rows: schedules } = await pool.query(
    `SELECT
       e.id AS exam_schedule_id, e.exam_type, e.exam_date, e.max_marks,
       tr.term_name, ac.year_name
     FROM exam_schedules e
     JOIN terms tr ON tr.id = e.term_id
     JOIN academic_years ac ON ac.id = tr.academic_year_id
     WHERE e.class_id = $1 AND e.section_id = $2 AND e.curriculum_subject_id = $3
     ORDER BY e.exam_date DESC`,
    [classId, sectionId, subjectId]
  );

  return schedules;
};

const getExamResults = async (examScheduleId) => {
  // Check if exam exists
  const { rows: schedules } = await pool.query(
    `SELECT class_id, section_id FROM exam_schedules WHERE id = $1`,
    [examScheduleId]
  );
  if (!schedules.length) throw new Error('Exam schedule not found.');

  const classId = schedules[0].class_id;
  const sectionId = schedules[0].section_id;

  // Get all students in the class
  const { rows: students } = await pool.query(
    `SELECT
       s.id AS student_id, u.first_name, u.last_name, s.admission_number,
       er.marks_obtained, er.grade, er.teacher_remarks
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN exam_results er ON er.student_id = s.id AND er.exam_schedule_id = $1
     WHERE s.class_id = $2 AND s.section_id = $3 AND s.current_status = 'ACTIVE'
     ORDER BY u.last_name, u.first_name`,
    [examScheduleId, classId, sectionId]
  );

  return students;
};

const submitGrades = async (userId, examScheduleId, results) => {
  const teacherId = await getTeacherId(userId);

  // Simplified UPSERT for exam results
  for (const r of results) {
    if (r.marks_obtained !== null && r.marks_obtained !== undefined && r.marks_obtained !== '') {
      await pool.query(
        `INSERT INTO exam_results (exam_schedule_id, student_id, marks_obtained, teacher_id, teacher_remarks, grade)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (exam_schedule_id, student_id)
         DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained,
                       teacher_id = EXCLUDED.teacher_id,
                       teacher_remarks = EXCLUDED.teacher_remarks,
                       grade = EXCLUDED.grade`,
        [examScheduleId, r.student_id, r.marks_obtained, teacherId, r.teacher_remarks || null, r.grade || null]
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
       a.id, a.title, a.body, a.audience, a.priority, a.created_at, u.first_name, u.last_name
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     WHERE a.is_published = TRUE
       AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
       AND a.audience IN ('ALL', 'TEACHERS', 'STAFF')
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
