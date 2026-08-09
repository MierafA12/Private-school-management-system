const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

const getDashboardAnalytics = async () => {
  // 1. Total Active Students
  const { rows: studentCount } = await pool.query(
    `SELECT COUNT(*) AS total FROM students WHERE current_status = 'ACTIVE'`
  );

  // 2. Total Teachers
  const { rows: teacherCount } = await pool.query(
    `SELECT COUNT(*) AS total FROM teachers`
  );

  // 3. Total Staff
  const { rows: staffCount } = await pool.query(
    `SELECT COUNT(*) AS total FROM staff`
  );

  // 4. Today's Attendance Rate
  const { rows: att } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
       COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE s.attendance_date = CURRENT_DATE`
  );

  const attRow = att[0];
  const attendancePct = attRow.total > 0
    ? Math.round((attRow.present / attRow.total) * 100)
    : null;

  return {
    totalStudents: parseInt(studentCount[0].total),
    totalTeachers: parseInt(teacherCount[0].total),
    totalStaff: parseInt(staffCount[0].total),
    todayAttendancePct: attendancePct,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

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
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      title, body, audience || 'ALL', class_id || null, priority || 'NORMAL',
      is_published !== undefined ? is_published : true,
      publish_at || new Date(),
      expires_at || null,
      userId
    ]
  );
  return rows[0];
};

const deleteAnnouncement = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM announcements WHERE id = $1 RETURNING id`,
    [id]
  );
  if (!rows.length) {
    const err = new Error('Announcement not found');
    err.status = 404;
    throw err;
  }
  return true;
};

module.exports = {
  getDashboardAnalytics,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
};
