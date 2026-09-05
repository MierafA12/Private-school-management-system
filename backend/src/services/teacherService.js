const pool = require('../db');

// ─── Get teacher record by user_id ────────────────────────────────────────────
const getTeacherByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT t.*, u.email FROM teachers t JOIN users u ON u.id = t.user_id WHERE t.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

// ─── Classes / sections assigned to this teacher via timetable ────────────────
const getAssignedClasses = async (teacherId) => {
  // NOTE: Cannot use SELECT DISTINCT with ORDER BY on non-selected columns in PostgreSQL.
  // Use a subquery instead.
  const { rows } = await pool.query(
    `SELECT
       t.class_id, c.name AS class_name, c.grade_level,
       t.section_id, sec.name AS section_name,
       cs.id AS curriculum_subject_id,
       sub.id AS subject_id,
       sub.name AS subject_name, sub.code AS subject_code,
       t.academic_year_id, ay.name AS academic_year,
       t.term_id, ter.name AS term_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN terms ter ON ter.id = t.term_id
     WHERE t.teacher_id = $1 AND ay.is_current = TRUE
     GROUP BY
       t.class_id, c.name, c.grade_level,
       t.section_id, sec.name,
       cs.id, sub.id, sub.name, sub.code,
       t.academic_year_id, ay.name,
       t.term_id, ter.name
     ORDER BY c.grade_level, sec.name, sub.name`,
    [teacherId]
  );
  return rows;
};

// ─── Today's timetable ────────────────────────────────────────────────────────
const getTodayClasses = async (teacherId) => {
  const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  const { rows } = await pool.query(
    `SELECT
       t.id AS timetable_id,
       t.period_number, t.start_time, t.end_time, t.room_number,
       t.day_of_week,
       c.name AS class_name, sec.name AS section_name,
       sub.name AS subject_name, sub.code AS subject_code,
       ter.name AS term_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN terms ter ON ter.id = t.term_id
     WHERE t.teacher_id = $1
       AND t.day_of_week = $2
       AND ay.is_current = TRUE
     ORDER BY t.period_number`,
    [teacherId, dayName]
  );
  return rows;
};

// ─── Full weekly timetable ────────────────────────────────────────────────────
const getWeeklyTimetable = async (teacherId) => {
  const { rows } = await pool.query(
    `SELECT
       t.id, t.period_number, t.start_time, t.end_time,
       t.day_of_week, t.room_number,
       c.name AS class_name, sec.name AS section_name,
       sub.name AS subject_name,
       ter.name AS term_name
     FROM timetables t
     JOIN classes c ON c.id = t.class_id
     JOIN sections sec ON sec.id = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects sub ON sub.id = cs.subject_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN terms ter ON ter.id = t.term_id
     WHERE t.teacher_id = $1 AND ay.is_current = TRUE
     ORDER BY
       CASE t.day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
         WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END,
       t.period_number`,
    [teacherId]
  );
  return rows;
};

// ─── Dashboard stats ──────────────────────────────────────────────────────────
const getDashboard = async (teacherId) => {
  const [todayClasses, assignedClasses] = await Promise.all([
    getTodayClasses(teacherId),
    getAssignedClasses(teacherId),
  ]);

  const uniqueSections = new Set(assignedClasses.map(c => c.section_id));

  return {
    classesToday:       todayClasses,
    assignedClassCount: uniqueSections.size,
    totalSubjects:      assignedClasses.length,
  };
};

// ─── Attendance for a section on a date ───────────────────────────────────────
const getAttendanceSheet = async (classId, sectionId, date) => {
  // Get enrolled students
  const { rows: students } = await pool.query(
    `SELECT s.id AS student_id, s.first_name, s.last_name,
            s.admission_number, e.roll_number
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.class_id = $1 AND e.section_id = $2
       AND e.enrollment_status = 'ACTIVE'
       AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1)
     ORDER BY e.roll_number, s.last_name`,
    [classId, sectionId]
  );

  // Check existing session for this date
  const { rows: sessions } = await pool.query(
    `SELECT * FROM attendance_sessions
     WHERE class_id = $1 AND section_id = $2 AND attendance_date = $3
     LIMIT 1`,
    [classId, sectionId, date]
  );

  let records = [];
  if (sessions.length) {
    const { rows } = await pool.query(
      `SELECT * FROM attendance_records WHERE attendance_session_id = $1`,
      [sessions[0].id]
    );
    records = rows;
  }

  // Merge existing records onto students
  const recordMap = {};
  records.forEach(r => { recordMap[r.student_id] = r; });

  return students.map(stu => ({
    ...stu,
    attendance_status: recordMap[stu.student_id]?.attendance_status || 'Present',
    remarks:           recordMap[stu.student_id]?.remarks || '',
    session_id:        sessions[0]?.id || null,
  }));
};

// ─── Submit attendance ────────────────────────────────────────────────────────
const submitAttendance = async (teacherId, { classId, sectionId, date, records }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get or create the term for this date
    const { rows: termRows } = await client.query(
      `SELECT t.id, t.academic_year_id FROM terms t
       JOIN academic_years ay ON ay.id = t.academic_year_id
       WHERE ay.is_current = TRUE
         AND $1 BETWEEN t.start_date AND t.end_date
       LIMIT 1`,
      [date]
    );
    if (!termRows.length) throw Object.assign(new Error('No active term found for this date.'), { status: 422 });
    const { id: termId, academic_year_id } = termRows[0];

    // Upsert session
    const { rows: sessionRows } = await client.query(
      `INSERT INTO attendance_sessions
         (academic_year_id, term_id, class_id, section_id, teacher_id,
          attendance_date, attendance_type, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'DAILY',$7)
       ON CONFLICT (section_id, attendance_date)
       WHERE attendance_type = 'DAILY'
       DO UPDATE SET teacher_id = EXCLUDED.teacher_id, updated_at = NOW()
       RETURNING id`,
      [academic_year_id, termId, classId, sectionId, teacherId, date, teacherId]
    );
    const sessionId = sessionRows[0].id;

    // Upsert each student record
    for (const rec of records) {
      await client.query(
        `INSERT INTO attendance_records
           (attendance_session_id, student_id, attendance_status, remarks, marked_by)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (attendance_session_id, student_id)
         DO UPDATE SET
           attendance_status = EXCLUDED.attendance_status,
           remarks           = EXCLUDED.remarks,
           marked_by         = EXCLUDED.marked_by,
           updated_at        = NOW()`,
        [sessionId, rec.student_id, rec.attendance_status || 'Present', rec.remarks || null, teacherId]
      );
    }

    await client.query('COMMIT');
    return { session_id: sessionId, count: records.length };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── Students in a section ────────────────────────────────────────────────────
const getSectionStudents = async (classId, sectionId) => {
  const { rows } = await pool.query(
    `SELECT s.id, s.first_name, s.last_name, s.student_number,
            s.admission_number, e.roll_number
     FROM enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.class_id = $1 AND e.section_id = $2
       AND e.enrollment_status = 'ACTIVE'
       AND e.academic_year_id = (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1)
     ORDER BY e.roll_number, s.last_name`,
    [classId, sectionId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIMETABLE PUBLISH / BROADCAST
// When a principal publishes, mark the timetable as published for a section/term.
// Students and teachers in that section can then see it.
// We track this with a simple timetables_published helper table or a flag.
// Since altering the existing timetables table would require a migration,
// we use the existing data — timetables are always visible once created.
// Broadcast = create an announcement targeting the section's class.
// ─────────────────────────────────────────────────────────────────────────────

const broadcastTimetable = async (userId, { term_id, section_id, class_id, term_name, class_name, section_name }) => {
  const pool = require('../db');

  // Create an announcement for the class
  const title = `📅 Timetable Published — ${class_name} Section ${section_name}`;
  const body  = `The weekly timetable for ${class_name} Section ${section_name} (${term_name}) has been published. Please check your portal to view your schedule.`;

  const { rows } = await pool.query(
    `INSERT INTO announcements
       (title, body, audience, class_id, priority, is_published, publish_at, created_by)
     VALUES ($1, $2, 'CLASS', $3, 'NORMAL', TRUE, NOW(), $4)
     RETURNING *`,
    [title, body, class_id, userId]
  );
  return rows[0];
};

module.exports = {
  getTeacherByUserId,
  getAssignedClasses,
  getTodayClasses,
  getWeeklyTimetable,
  getDashboard,
  getAttendanceSheet,
  submitAttendance,
  getSectionStudents,
  broadcastTimetable,
};
