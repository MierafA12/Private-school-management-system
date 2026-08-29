const pool = require('../db');

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═════════════════════════════════════════════════════════════════════════════

const getDashboardStats = async () => {
  const [students, teachers, staff, classes, enrollments, attendanceToday] =
    await Promise.all([
      pool.query(`SELECT COUNT(*) FROM students WHERE current_status = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) FROM teachers WHERE employment_status = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) FROM staff   WHERE employment_status = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) FROM classes`),
      pool.query(
        `SELECT COUNT(*) FROM enrollments e
         JOIN academic_years ay ON ay.id = e.academic_year_id
         WHERE ay.is_current = TRUE AND e.enrollment_status = 'ACTIVE'`
      ),
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
           COUNT(*) AS total
         FROM attendance_records ar
         JOIN attendance_sessions s ON s.id = ar.attendance_session_id
         WHERE s.attendance_date = CURRENT_DATE`
      ),
    ]);

  const att = attendanceToday.rows[0];
  return {
    active_students:    parseInt(students.rows[0].count),
    active_teachers:    parseInt(teachers.rows[0].count),
    active_staff:       parseInt(staff.rows[0].count),
    total_classes:      parseInt(classes.rows[0].count),
    current_enrollments:parseInt(enrollments.rows[0].count),
    today_attendance_pct:
      att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
  };
};

// ═════════════════════════════════════════════════════════════════════════════
// ACADEMIC YEARS
// ═════════════════════════════════════════════════════════════════════════════

const getAcademicYears = async () => {
  const { rows } = await pool.query(
    `SELECT ay.*,
       (SELECT COUNT(*) FROM terms t WHERE t.academic_year_id = ay.id) AS term_count,
       (SELECT COUNT(*) FROM enrollments e WHERE e.academic_year_id = ay.id) AS enrollment_count
     FROM academic_years ay
     ORDER BY ay.start_date DESC`
  );
  return rows;
};

const getAcademicYearById = async (id) => {
  const { rows: ay } = await pool.query(
    `SELECT * FROM academic_years WHERE id = $1`, [id]
  );
  if (!ay.length) return null;

  const { rows: terms } = await pool.query(
    `SELECT * FROM terms WHERE academic_year_id = $1 ORDER BY start_date`, [id]
  );
  return { ...ay[0], terms };
};

const createAcademicYear = async ({ name, start_date, end_date, is_current = false }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_current) {
      await client.query(
        `UPDATE academic_years SET is_current = FALSE, updated_at = NOW() WHERE is_current = TRUE`
      );
    }
    const { rows } = await client.query(
      `INSERT INTO academic_years (name, start_date, end_date, is_current, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE') RETURNING *`,
      [name, start_date, end_date, is_current]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateAcademicYear = async (id, fields) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (fields.is_current) {
      await client.query(
        `UPDATE academic_years SET is_current = FALSE, updated_at = NOW() WHERE is_current = TRUE AND id != $1`,
        [id]
      );
    }
    const { rows } = await client.query(
      `UPDATE academic_years
       SET name       = COALESCE($1, name),
           start_date = COALESCE($2, start_date),
           end_date   = COALESCE($3, end_date),
           is_current = COALESCE($4, is_current),
           status     = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [fields.name, fields.start_date, fields.end_date, fields.is_current, fields.status, id]
    );
    await client.query('COMMIT');
    return rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// TERMS
// ═════════════════════════════════════════════════════════════════════════════

const createTerm = async ({ academic_year_id, name, start_date, end_date, status = 'ACTIVE' }) => {
  const { rows } = await pool.query(
    `INSERT INTO terms (academic_year_id, name, start_date, end_date, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [academic_year_id, name, start_date, end_date, status]
  );
  return rows[0];
};

const updateTerm = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE terms
     SET name       = COALESCE($1, name),
         start_date = COALESCE($2, start_date),
         end_date   = COALESCE($3, end_date),
         status     = COALESCE($4, status),
         updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [fields.name, fields.start_date, fields.end_date, fields.status, id]
  );
  return rows[0] || null;
};

const deleteTerm = async (id) => {
  await pool.query(`DELETE FROM terms WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// CLASSES
// ═════════════════════════════════════════════════════════════════════════════

const getClasses = async () => {
  const { rows } = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*) FROM sections s WHERE s.class_id = c.id) AS section_count
     FROM classes c
     ORDER BY c.grade_level, c.name`
  );
  return rows;
};

const getClassById = async (id) => {
  const { rows: cls } = await pool.query(`SELECT * FROM classes WHERE id = $1`, [id]);
  if (!cls.length) return null;

  const { rows: sections } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM enrollments e
        JOIN academic_years ay ON ay.id = e.academic_year_id
        WHERE e.section_id = s.id AND ay.is_current = TRUE
          AND e.enrollment_status = 'ACTIVE') AS current_students
     FROM sections s WHERE s.class_id = $1 ORDER BY s.name`,
    [id]
  );
  return { ...cls[0], sections };
};

const createClass = async ({ name, grade_level, description }) => {
  const { rows } = await pool.query(
    `INSERT INTO classes (name, grade_level, description) VALUES ($1, $2, $3) RETURNING *`,
    [name, grade_level, description || null]
  );
  return rows[0];
};

const updateClass = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE classes
     SET name        = COALESCE($1, name),
         grade_level = COALESCE($2, grade_level),
         description = COALESCE($3, description),
         updated_at  = NOW()
     WHERE id = $4 RETURNING *`,
    [fields.name, fields.grade_level, fields.description, id]
  );
  return rows[0] || null;
};

const deleteClass = async (id) => {
  await pool.query(`DELETE FROM classes WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// SECTIONS
// ═════════════════════════════════════════════════════════════════════════════

const createSection = async ({ class_id, name, room_number, capacity }) => {
  const { rows } = await pool.query(
    `INSERT INTO sections (class_id, name, room_number, capacity)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [class_id, name, room_number || null, capacity || null]
  );
  return rows[0];
};

const updateSection = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE sections
     SET name        = COALESCE($1, name),
         room_number = COALESCE($2, room_number),
         capacity    = COALESCE($3, capacity),
         updated_at  = NOW()
     WHERE id = $4 RETURNING *`,
    [fields.name, fields.room_number, fields.capacity, id]
  );
  return rows[0] || null;
};

const deleteSection = async (id) => {
  await pool.query(`DELETE FROM sections WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// SUBJECTS
// ═════════════════════════════════════════════════════════════════════════════

const getSubjects = async () => {
  const { rows } = await pool.query(
    `SELECT s.*,
       (SELECT COUNT(*) FROM curriculum_subjects cs WHERE cs.subject_id = s.id) AS curriculum_count
     FROM subjects s ORDER BY s.name`
  );
  return rows;
};

const createSubject = async ({ code, name, description }) => {
  const { rows } = await pool.query(
    `INSERT INTO subjects (code, name, description) VALUES ($1, $2, $3) RETURNING *`,
    [code.toUpperCase(), name, description || null]
  );
  return rows[0];
};

const updateSubject = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE subjects
     SET code        = COALESCE($1, code),
         name        = COALESCE($2, name),
         description = COALESCE($3, description),
         updated_at  = NOW()
     WHERE id = $4 RETURNING *`,
    [fields.code?.toUpperCase(), fields.name, fields.description, id]
  );
  return rows[0] || null;
};

const deleteSubject = async (id) => {
  await pool.query(`DELETE FROM subjects WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// CURRICULUM SUBJECTS (assign subject to class for a year)
// ═════════════════════════════════════════════════════════════════════════════

const getCurriculumForClass = async (academicYearId, classId) => {
  const { rows } = await pool.query(
    `SELECT cs.*, s.name AS subject_name, s.code AS subject_code
     FROM curriculum_subjects cs
     JOIN subjects s ON s.id = cs.subject_id
     WHERE cs.academic_year_id = $1 AND cs.class_id = $2
     ORDER BY s.name`,
    [academicYearId, classId]
  );
  return rows;
};

const assignSubjectToClass = async ({
  academic_year_id, class_id, subject_id,
  is_core = true, weekly_periods = 5, pass_mark = 50, max_mark = 100,
}) => {
  const { rows } = await pool.query(
    `INSERT INTO curriculum_subjects
       (academic_year_id, class_id, subject_id, is_core, weekly_periods, pass_mark, max_mark)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (academic_year_id, class_id, subject_id)
     DO UPDATE SET
       is_core        = EXCLUDED.is_core,
       weekly_periods = EXCLUDED.weekly_periods,
       pass_mark      = EXCLUDED.pass_mark,
       max_mark       = EXCLUDED.max_mark,
       updated_at     = NOW()
     RETURNING *`,
    [academic_year_id, class_id, subject_id, is_core, weekly_periods, pass_mark, max_mark]
  );
  return rows[0];
};

const removeSubjectFromClass = async (id) => {
  await pool.query(`DELETE FROM curriculum_subjects WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// SCHOOL OVERVIEW (for the stats page — enrollment by class)
// ═════════════════════════════════════════════════════════════════════════════

const getEnrollmentOverview = async () => {
  const { rows } = await pool.query(
    `SELECT
       c.name  AS class_name,
       c.grade_level,
       s.name  AS section_name,
       COUNT(e.id) AS enrolled
     FROM classes c
     JOIN sections s ON s.class_id = c.id
     LEFT JOIN enrollments e ON e.section_id = s.id
       AND e.enrollment_status = 'ACTIVE'
       AND e.academic_year_id = (
         SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1
       )
     GROUP BY c.id, c.name, c.grade_level, s.id, s.name
     ORDER BY c.grade_level, s.name`
  );
  return rows;
};

const getAttendanceTrend = async (days = 14) => {
  const { rows } = await pool.query(
    `SELECT
       s.attendance_date::date AS date,
       COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
       COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE s.attendance_date >= CURRENT_DATE - INTERVAL '${days} days'
     GROUP BY s.attendance_date::date
     ORDER BY s.attendance_date::date`
  );
  return rows.map(r => ({
    date:    r.date,
    present: parseInt(r.present),
    total:   parseInt(r.total),
    pct:     r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
  }));
};

module.exports = {
  getDashboardStats,
  getAcademicYears, getAcademicYearById, createAcademicYear, updateAcademicYear,
  createTerm, updateTerm, deleteTerm,
  getClasses, getClassById, createClass, updateClass, deleteClass,
  createSection, updateSection, deleteSection,
  getSubjects, createSubject, updateSubject, deleteSubject,
  getCurriculumForClass, assignSubjectToClass, removeSubjectFromClass,
  getEnrollmentOverview, getAttendanceTrend,
};
