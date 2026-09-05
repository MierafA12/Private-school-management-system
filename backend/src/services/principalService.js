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
    active_students:      parseInt(students.rows[0].count),
    active_teachers:      parseInt(teachers.rows[0].count),
    active_staff:         parseInt(staff.rows[0].count),
    total_classes:        parseInt(classes.rows[0].count),
    current_enrollments:  parseInt(enrollments.rows[0].count),
    // alias used by the incoming dashboard component
    totalStudents:        parseInt(students.rows[0].count),
    totalTeachers:        parseInt(teachers.rows[0].count),
    totalStaff:           parseInt(staff.rows[0].count),
    today_attendance_pct:
      att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
    todayAttendancePct:
      att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
  };
};

// alias for incoming code that calls getDashboardAnalytics
const getDashboardAnalytics = getDashboardStats;

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
  const { rows: ay } = await pool.query(`SELECT * FROM academic_years WHERE id = $1`, [id]);
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
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
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
  } catch (err) { await client.query('ROLLBACK'); throw err; }
  finally { client.release(); }
};

const deleteAcademicYear = async (id) => {
  const { rows: ay } = await pool.query(`SELECT * FROM academic_years WHERE id = $1`, [id]);
  if (!ay.length) {
    const err = new Error('Academic year not found.');
    err.status = 404;
    throw err;
  }

  // Check if current
  if (ay[0].is_current) {
    const { rows: total } = await pool.query(`SELECT COUNT(*) FROM academic_years`);
    if (parseInt(total[0].count) > 1) {
      const err = new Error('Cannot delete the active academic year. Please set another academic year as current first.');
      err.status = 400;
      throw err;
    }
  }

  // Check enrollments
  const { rows: enrollments } = await pool.query(
    `SELECT COUNT(*) FROM enrollments WHERE academic_year_id = $1`,
    [id]
  );
  if (parseInt(enrollments[0].count) > 0) {
    const err = new Error(`Cannot delete academic year with ${enrollments[0].count} enrolled student(s). Reassign or remove enrollments first.`);
    err.status = 400;
    throw err;
  }

  // Check fee structures
  const { rows: fees } = await pool.query(
    `SELECT COUNT(*) FROM fee_structures WHERE academic_year_id = $1`,
    [id]
  );
  if (parseInt(fees[0].count) > 0) {
    const err = new Error(`Cannot delete academic year with linked fee structure(s).`);
    err.status = 400;
    throw err;
  }

  await pool.query(`DELETE FROM academic_years WHERE id = $1`, [id]);
  return { success: true };
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

const deleteTerm = async (id) => pool.query(`DELETE FROM terms WHERE id = $1`, [id]);

// ═════════════════════════════════════════════════════════════════════════════
// CLASSES
// ═════════════════════════════════════════════════════════════════════════════

const getClasses = async () => {
  const { rows } = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*) FROM sections s WHERE s.class_id = c.id) AS section_count
     FROM classes c ORDER BY c.grade_level, c.name`
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

const deleteClass = async (id) => pool.query(`DELETE FROM classes WHERE id = $1`, [id]);

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

const deleteSection = async (id) => pool.query(`DELETE FROM sections WHERE id = $1`, [id]);

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

const deleteSubject = async (id) => pool.query(`DELETE FROM subjects WHERE id = $1`, [id]);

// ═════════════════════════════════════════════════════════════════════════════
// CURRICULUM SUBJECTS
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

const removeSubjectFromClass = async (id) =>
  pool.query(`DELETE FROM curriculum_subjects WHERE id = $1`, [id]);

// ═════════════════════════════════════════════════════════════════════════════
// SCHOOL OVERVIEW
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

// ═════════════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS  (from incoming branch)
// ═════════════════════════════════════════════════════════════════════════════

const getAnnouncements = async ({ limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT
       a.id, a.title, a.body, a.audience,
       a.priority, a.is_published, a.publish_at, a.expires_at,
       u.email AS created_by_email
     FROM announcements a
     LEFT JOIN users u ON u.id = a.created_by
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const createAnnouncement = async (userId, data) => {
  const { title, body, audience, class_id, priority, is_published, publish_at, expires_at } = data;
  const { rows } = await pool.query(
    `INSERT INTO announcements (
       title, body, audience, class_id, priority,
       is_published, publish_at, expires_at, created_by
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      title, body, audience || 'ALL', class_id || null, priority || 'NORMAL',
      is_published !== undefined ? is_published : true,
      publish_at || new Date(),
      expires_at || null,
      userId,
    ]
  );
  return rows[0];
};

const deleteAnnouncement = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM announcements WHERE id = $1 RETURNING id`, [id]
  );
  if (!rows.length) {
    const err = new Error('Announcement not found.'); err.status = 404; throw err;
  }
  return true;
};

// ═════════════════════════════════════════════════════════════════════════════
// GRADING SCALES
// ═════════════════════════════════════════════════════════════════════════════

const getGradingScales = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM grading_scales ORDER BY sort_order, min_percentage DESC`
  );
  return rows;
};

const createGradingScale = async ({ name, min_percentage, max_percentage, label, is_pass = true, sort_order = 0 }) => {
  const { rows } = await pool.query(
    `INSERT INTO grading_scales (name, min_percentage, max_percentage, label, is_pass, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, min_percentage, max_percentage, label || null, is_pass, sort_order]
  );
  return rows[0];
};

const updateGradingScale = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE grading_scales
     SET name            = COALESCE($1, name),
         min_percentage  = COALESCE($2, min_percentage),
         max_percentage  = COALESCE($3, max_percentage),
         label           = COALESCE($4, label),
         is_pass         = COALESCE($5, is_pass),
         sort_order      = COALESCE($6, sort_order),
         updated_at      = NOW()
     WHERE id = $7 RETURNING *`,
    [fields.name, fields.min_percentage, fields.max_percentage,
     fields.label, fields.is_pass, fields.sort_order, id]
  );
  return rows[0] || null;
};

const deleteGradingScale = async (id) => {
  await pool.query(`DELETE FROM grading_scales WHERE id = $1`, [id]);
};

// Lookup: given a percentage, return the matching grade
const getGradeForPercentage = async (pct) => {
  const { rows } = await pool.query(
    `SELECT * FROM grading_scales
     WHERE $1 >= min_percentage AND $1 <= max_percentage
     LIMIT 1`,
    [pct]
  );
  return rows[0] || null;
};

// ═════════════════════════════════════════════════════════════════════════════
// SCHOOL PROFILE
// ═════════════════════════════════════════════════════════════════════════════

const getSchoolProfile = async () => {
  const { rows } = await pool.query(`SELECT * FROM school_profile LIMIT 1`);
  return rows[0] || null;
};

const updateSchoolProfile = async (fields) => {
  // Upsert — if a row exists update it, otherwise insert
  const profile = await getSchoolProfile();
  if (!profile) {
    const { rows } = await pool.query(
      `INSERT INTO school_profile
         (name, motto, logo_url, address, city, country, phone, email, website,
          registration_number, principal_name, currency, academic_year_start_month, terms_per_year)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        fields.name, fields.motto || null, fields.logo_url || null,
        fields.address || null, fields.city || null, fields.country || 'Ethiopia',
        fields.phone || null, fields.email || null, fields.website || null,
        fields.registration_number || null, fields.principal_name || null,
        fields.currency || 'ETB',
        fields.academic_year_start_month || 1, fields.terms_per_year || 3,
      ]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `UPDATE school_profile
     SET name                       = COALESCE($1,  name),
         motto                      = COALESCE($2,  motto),
         logo_url                   = COALESCE($3,  logo_url),
         address                    = COALESCE($4,  address),
         city                       = COALESCE($5,  city),
         country                    = COALESCE($6,  'Ethiopia'),
         phone                      = COALESCE($7,  phone),
         email                      = COALESCE($8,  email),
         website                    = COALESCE($9,  website),
         registration_number        = COALESCE($10, registration_number),
         principal_name             = COALESCE($11, principal_name),
         currency                   = COALESCE($12, currency),
         academic_year_start_month  = COALESCE($13, academic_year_start_month),
         terms_per_year             = COALESCE($14, terms_per_year),
         updated_at                 = NOW()
     WHERE id = $15 RETURNING *`,
    [
      fields.name, fields.motto, fields.logo_url,
      fields.address, fields.city, fields.country || 'Ethiopia',
      fields.phone, fields.email, fields.website,
      fields.registration_number, fields.principal_name,
      fields.currency || 'ETB', fields.academic_year_start_month, fields.terms_per_year,
      profile.id,
    ]
  );
  return rows[0];
};

// ═════════════════════════════════════════════════════════════════════════════
// CLASS ADVISORS (homeroom assignments)
// ═════════════════════════════════════════════════════════════════════════════

const getClassAdvisors = async (academicYearId) => {
  const { rows } = await pool.query(
    `SELECT
       ca.*,
       c.name   AS class_name,
       s.name   AS section_name,
       ay.name  AS academic_year,
       (t.first_name || ' ' || t.last_name) AS teacher_name,
       t.employee_number
     FROM class_advisors ca
     JOIN classes        c  ON c.id  = ca.class_id
     JOIN sections       s  ON s.id  = ca.section_id
     JOIN academic_years ay ON ay.id = ca.academic_year_id
     JOIN teachers       t  ON t.id  = ca.teacher_id
     WHERE ca.academic_year_id = $1
     ORDER BY c.grade_level, s.name`,
    [academicYearId]
  );
  return rows;
};

const assignClassAdvisor = async ({ academic_year_id, class_id, section_id, teacher_id, assigned_date }) => {
  const { rows } = await pool.query(
    `INSERT INTO class_advisors (academic_year_id, class_id, section_id, teacher_id, assigned_date)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (academic_year_id, section_id)
     DO UPDATE SET teacher_id = EXCLUDED.teacher_id,
                   assigned_date = EXCLUDED.assigned_date,
                   updated_at = NOW()
     RETURNING *`,
    [academic_year_id, class_id, section_id, teacher_id, assigned_date]
  );
  return rows[0];
};

const removeClassAdvisor = async (id) => {
  await pool.query(`DELETE FROM class_advisors WHERE id = $1`, [id]);
};

// ═════════════════════════════════════════════════════════════════════════════
// TIMETABLE MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

const getTimetable = async ({ academic_year_id, term_id, class_id, section_id }) => {
  const conditions = ['1=1'];
  const params     = [];
  let   p          = 1;

  if (academic_year_id) { conditions.push(`t.academic_year_id = $${p++}`); params.push(academic_year_id); }
  if (term_id)          { conditions.push(`t.term_id = $${p++}`);          params.push(term_id); }
  if (class_id)         { conditions.push(`t.class_id = $${p++}`);         params.push(class_id); }
  if (section_id)       { conditions.push(`t.section_id = $${p++}`);       params.push(section_id); }

  const { rows } = await pool.query(
    `SELECT
       t.*,
       c.name  AS class_name,
       s.name  AS section_name,
       sub.name AS subject_name,
       sub.code AS subject_code,
       (te.first_name || ' ' || te.last_name) AS teacher_name,
       te.employee_number
     FROM timetables t
     JOIN classes        c   ON c.id  = t.class_id
     JOIN sections       s   ON s.id  = t.section_id
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects       sub ON sub.id = cs.subject_id
     JOIN teachers       te  ON te.id = t.teacher_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY
       CASE t.day_of_week
         WHEN 'Monday'    THEN 1 WHEN 'Tuesday'   THEN 2
         WHEN 'Wednesday' THEN 3 WHEN 'Thursday'  THEN 4
         WHEN 'Friday'    THEN 5 WHEN 'Saturday'  THEN 6
         WHEN 'Sunday'    THEN 7
       END,
       t.period_number`,
    params
  );
  return rows;
};

const createTimetableSlot = async (fields) => {
  const { rows } = await pool.query(
    `INSERT INTO timetables
       (academic_year_id, term_id, class_id, section_id,
        curriculum_subject_id, teacher_id,
        day_of_week, period_number, start_time, end_time, room_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [
      fields.academic_year_id, fields.term_id,
      fields.class_id, fields.section_id,
      fields.curriculum_subject_id, fields.teacher_id,
      fields.day_of_week, fields.period_number,
      fields.start_time, fields.end_time,
      fields.room_number || null,
    ]
  );
  return rows[0];
};

const updateTimetableSlot = async (id, fields) => {
  const { rows } = await pool.query(
    `UPDATE timetables
     SET curriculum_subject_id = COALESCE($1, curriculum_subject_id),
         teacher_id            = COALESCE($2, teacher_id),
         day_of_week           = COALESCE($3, day_of_week),
         period_number         = COALESCE($4, period_number),
         start_time            = COALESCE($5, start_time),
         end_time              = COALESCE($6, end_time),
         room_number           = COALESCE($7, room_number),
         updated_at            = NOW()
     WHERE id = $8 RETURNING *`,
    [
      fields.curriculum_subject_id, fields.teacher_id,
      fields.day_of_week, fields.period_number,
      fields.start_time, fields.end_time,
      fields.room_number, id,
    ]
  );
  return rows[0] || null;
};

const deleteTimetableSlot = async (id) => {
  await pool.query(`DELETE FROM timetables WHERE id = $1`, [id]);
};

// Clear entire timetable for a section/term (rebuild from scratch)
const clearTimetable = async ({ term_id, section_id }) => {
  await pool.query(
    `DELETE FROM timetables WHERE term_id = $1 AND section_id = $2`,
    [term_id, section_id]
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TEACHER LIST  (for assignments/dropdowns)
// ═════════════════════════════════════════════════════════════════════════════

const getTeacherList = async () => {
  const { rows } = await pool.query(
    `SELECT
       t.id, t.employee_number,
       t.first_name, t.last_name,
       (t.first_name || ' ' || t.last_name) AS full_name,
       t.specialization, t.employment_status,
       u.email
     FROM teachers t
     JOIN users u ON u.id = t.user_id
     WHERE t.employment_status = 'ACTIVE'
     ORDER BY t.last_name, t.first_name`
  );
  return rows;
};

// ═════════════════════════════════════════════════════════════════════════════
// FEE STRUCTURES (Principal manages, Accountant operates)
// ═════════════════════════════════════════════════════════════════════════════

const getFeeStructures = async (academicYearId) => {
  const conditions = academicYearId
    ? `WHERE fs.academic_year_id = $1`
    : `WHERE 1=1`;
  const params = academicYearId ? [academicYearId] : [];
  const { rows } = await pool.query(
    `SELECT
       fs.*,
       COALESCE(fs.fee_type, fs.category) AS fee_type,
       COALESCE(fs.category, fs.fee_type) AS category,
       ay.name AS academic_year_name,
       c.name  AS class_name
     FROM fee_structures fs
     JOIN academic_years ay ON ay.id = fs.academic_year_id
     LEFT JOIN classes c ON c.id = fs.class_id
     ${conditions}
     ORDER BY ay.start_date DESC, COALESCE(fs.fee_type, fs.category, '')`,
    params
  );
  return rows;
};

const createFeeStructure = async (fields) => {
  const feeType = fields.fee_type || fields.category || 'Tuition';
  const { rows } = await pool.query(
    `INSERT INTO fee_structures
       (academic_year_id, class_id, fee_type, category, amount, currency, due_date, description, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE') RETURNING *`,
    [
      fields.academic_year_id, fields.class_id || null,
      feeType, feeType, fields.amount, fields.currency || 'ETB',
      fields.due_date || null, fields.description || null,
    ]
  );
  return {
    ...rows[0],
    fee_type: rows[0].fee_type || rows[0].category,
    category: rows[0].category || rows[0].fee_type,
  };
};

const updateFeeStructure = async (id, fields) => {
  const feeType = fields.fee_type || fields.category || null;
  const { rows } = await pool.query(
    `UPDATE fee_structures
     SET fee_type    = COALESCE($1, fee_type),
         category    = COALESCE($1, category),
         amount      = COALESCE($2, amount),
         currency    = COALESCE($3, currency),
         due_date    = COALESCE($4, due_date),
         description = COALESCE($5, description),
         class_id    = COALESCE($6, class_id),
         updated_at  = NOW()
     WHERE id = $7 RETURNING *`,
    [feeType, fields.amount, fields.currency,
     fields.due_date, fields.description, fields.class_id, id]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    fee_type: rows[0].fee_type || rows[0].category,
    category: rows[0].category || rows[0].fee_type,
  };
};

const deleteFeeStructure = async (id) => {
  await pool.query(`DELETE FROM fee_structures WHERE id = $1`, [id]);
};

module.exports = {
  // Dashboard
  getDashboardStats,
  getDashboardAnalytics,

  // Academic years
  getAcademicYears, getAcademicYearById, createAcademicYear, updateAcademicYear, deleteAcademicYear,

  // Terms
  createTerm, updateTerm, deleteTerm,

  // Classes & sections
  getClasses, getClassById, createClass, updateClass, deleteClass,
  createSection, updateSection, deleteSection,

  // Subjects & curriculum
  getSubjects, createSubject, updateSubject, deleteSubject,
  getCurriculumForClass, assignSubjectToClass, removeSubjectFromClass,

  // Overview
  getEnrollmentOverview, getAttendanceTrend,

  // Announcements
  getAnnouncements, createAnnouncement, deleteAnnouncement,

  // Grading scales
  getGradingScales, createGradingScale, updateGradingScale,
  deleteGradingScale, getGradeForPercentage,

  // School profile
  getSchoolProfile, updateSchoolProfile,

  // Class advisors
  getClassAdvisors, assignClassAdvisor, removeClassAdvisor,

  // Timetable
  getTimetable, createTimetableSlot, updateTimetableSlot,
  deleteTimetableSlot, clearTimetable,

  // Teachers list
  getTeacherList,

  // Fee structures
  getFeeStructures, createFeeStructure, updateFeeStructure, deleteFeeStructure,
};
