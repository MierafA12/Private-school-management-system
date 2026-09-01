const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// PARENT PROFILE & LINKED CHILDREN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the parent record by user_id
 */
const getParentByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.first_name, p.last_name, p.relationship,
            p.occupation, p.emergency_phone, p.address, p.profile_photo,
            u.email, u.phone
     FROM parents p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Get all students linked to this parent — always scoped to student_parents
 */
const getLinkedChildren = async (parentId) => {
  const { rows } = await pool.query(
    `SELECT
       s.id,
       s.student_number,
       s.first_name,
       s.last_name,
       s.gender,
       s.date_of_birth,
       s.profile_photo,
       s.current_status,
       sp.is_primary_contact,
       e.roll_number,
       ay.name  AS academic_year,
       c.name   AS class_name,
       c.grade_level,
       sec.name AS section_name
     FROM student_parents sp
     JOIN students      s   ON s.id   = sp.student_id
     LEFT JOIN enrollments  e   ON e.student_id = s.id
       AND e.enrollment_status = 'ACTIVE'
     LEFT JOIN academic_years ay ON ay.id = e.academic_year_id AND ay.is_current = TRUE
     LEFT JOIN classes        c   ON c.id  = e.class_id
     LEFT JOIN sections       sec ON sec.id = e.section_id
     WHERE sp.parent_id = $1
     ORDER BY s.first_name`,
    [parentId]
  );
  return rows;
};

/**
 * Get IDs of all students linked to this parent (used for ownership checks)
 */
const getLinkedStudentIds = async (parentId) => {
  const { rows } = await pool.query(
    `SELECT student_id FROM student_parents WHERE parent_id = $1`,
    [parentId]
  );
  return rows.map(r => r.student_id);
};

/**
 * Get single child profile — only if linked
 */
const getChildProfile = async (studentId, linkedIds) => {
  if (!linkedIds.includes(studentId)) {
    const err = new Error('Access denied to this student record.'); err.status = 403; throw err;
  }
  const { rows } = await pool.query(
    `SELECT
       s.*, u.email, u.phone,
       e.roll_number, e.enrollment_status,
       ay.name  AS academic_year,
       c.name   AS class_name,
       c.grade_level,
       sec.name AS section_name
     FROM students s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN enrollments  e   ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     LEFT JOIN academic_years ay ON ay.id = e.academic_year_id AND ay.is_current = TRUE
     LEFT JOIN classes        c   ON c.id  = e.class_id
     LEFT JOIN sections       sec ON sec.id = e.section_id
     WHERE s.id = $1`,
    [studentId]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

const getChildAttendance = async (studentId, year, month) => {
  const { rows } = await pool.query(
    `SELECT
       ar.id,
       s.attendance_date,
       ar.attendance_status,
       ar.arrival_time,
       ar.reason,
       s.attendance_type,
       s.period_number
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE ar.student_id = $1
       AND EXTRACT(YEAR  FROM s.attendance_date) = $2
       AND EXTRACT(MONTH FROM s.attendance_date) = $3
     ORDER BY s.attendance_date`,
    [studentId, year, month]
  );
  return rows;
};

const getChildAttendanceSummary = async (studentId, termId) => {
  const { rows } = await pool.query(
    `SELECT ar.attendance_status, COUNT(*) AS count
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE ar.student_id = $1 AND s.term_id = $2
     GROUP BY ar.attendance_status`,
    [studentId, termId]
  );
  return rows;
};

const getChildYearlyAttendance = async (studentId, academicYearId) => {
  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(s.attendance_date, 'Mon YYYY') AS month,
       COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
       COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     JOIN terms t ON t.id = s.term_id
     WHERE ar.student_id = $1 AND t.academic_year_id = $2
     GROUP BY TO_CHAR(s.attendance_date, 'Mon YYYY'), EXTRACT(MONTH FROM s.attendance_date)
     ORDER BY EXTRACT(MONTH FROM s.attendance_date)`,
    [studentId, academicYearId]
  );
  return rows.map(r => ({
    month:   r.month,
    present: parseInt(r.present),
    total:   parseInt(r.total),
    pct:     r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
  }));
};

// ─────────────────────────────────────────────────────────────────────────────
// GRADES / EXAM RESULTS
// ─────────────────────────────────────────────────────────────────────────────

const getChildGrades = async (studentId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       er.id,
       er.marks_obtained,
       er.is_absent,
       er.remarks,
       es.title,
       es.exam_type,
       es.max_marks,
       es.exam_date,
       s.name AS subject_name,
       ROUND((er.marks_obtained::NUMERIC / NULLIF(es.max_marks,0)) * 100, 1) AS percentage
     FROM exam_results er
     JOIN exam_schedules es ON es.id = er.exam_schedule_id
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     WHERE er.student_id = $1
       AND es.term_id    = $2
       AND es.is_published = TRUE
     ORDER BY es.exam_date DESC`,
    [studentId, termId]
  );
  return rows;
};

const getChildUpcomingExams = async (sectionId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       es.id, es.title, es.exam_date, es.start_time,
       es.end_time, es.venue, es.exam_type, es.max_marks,
       s.name AS subject_name
     FROM exam_schedules es
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     WHERE es.section_id = $1
       AND es.term_id    = $2
       AND es.exam_date >= CURRENT_DATE
     ORDER BY es.exam_date, es.start_time`,
    [sectionId, termId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORT CARDS
// ─────────────────────────────────────────────────────────────────────────────

const getChildReportCards = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       rc.id, rc.total_marks, rc.total_percentage,
       rc.overall_grade, rc.class_rank, rc.advisor_remarks, rc.published_at,
       t.name  AS term_name,
       ay.name AS academic_year
     FROM report_cards rc
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE rc.student_id = $1 AND rc.is_published = TRUE
     ORDER BY rc.published_at DESC`,
    [studentId]
  );
  return rows;
};

const getChildReportCardById = async (reportCardId, studentId) => {
  const { rows: header } = await pool.query(
    `SELECT rc.*, t.name AS term_name, ay.name AS academic_year
     FROM report_cards rc
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE rc.id = $1 AND rc.student_id = $2 AND rc.is_published = TRUE`,
    [reportCardId, studentId]
  );
  if (!header.length) return null;

  const { rows: subjects } = await pool.query(
    `SELECT
       rci.id, rci.total_marks, rci.percentage,
       rci.letter_grade, rci.teacher_remarks, rci.is_passed,
       s.name AS subject_name,
       (te.first_name || ' ' || te.last_name) AS teacher_name
     FROM report_card_items rci
     JOIN curriculum_subjects cs ON cs.id = rci.curriculum_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     LEFT JOIN teachers te ON te.id = rci.teacher_id
     WHERE rci.report_card_id = $1
     ORDER BY s.name`,
    [reportCardId]
  );
  return { ...header[0], subjects };
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

const getAnnouncements = async (classIds, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT
       a.id, a.title, a.body, a.audience,
       a.priority, a.publish_at, a.expires_at,
       u.email AS created_by_email
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     WHERE a.is_published = TRUE
       AND a.publish_at  <= NOW()
       AND (a.expires_at IS NULL OR a.expires_at > NOW())
       AND (
             a.audience IN ('ALL', 'PARENTS')
          OR (a.audience = 'CLASS' AND a.class_id = ANY($1::uuid[]))
       )
     ORDER BY
       CASE a.priority WHEN 'URGENT' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'NORMAL' THEN 3 ELSE 4 END,
       a.publish_at DESC
     LIMIT $2 OFFSET $3`,
    [classIds.length ? classIds : [null], limit, offset]
  );
  return rows;
};

const getEvents = async ({ limit = 20, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT
       e.id, e.title, e.description, e.event_date,
       e.start_time, e.end_time, e.location,
       e.rsvp_required, e.rsvp_deadline, e.capacity
     FROM events e
     WHERE e.is_published = TRUE
       AND e.event_date >= CURRENT_DATE
       AND e.audience IN ('ALL','PARENTS')
     ORDER BY e.event_date
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

const rsvpEvent = async (eventId, userId, response) => {
  const { rows } = await pool.query(
    `INSERT INTO event_rsvps (event_id, user_id, response)
     VALUES ($1, $2, $3)
     ON CONFLICT (event_id, user_id) DO UPDATE SET response = EXCLUDED.response
     RETURNING *`,
    [eventId, userId, response]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

const getDashboardSummary = async (parentId) => {
  const children = await getLinkedChildren(parentId);

  // For each child get attendance % and fee balance
  const summaries = await Promise.all(children.map(async (child) => {
    // attendance this term
    const { rows: att } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
         COUNT(*) AS total
       FROM attendance_records ar
       JOIN attendance_sessions sess ON sess.id = ar.attendance_session_id
       JOIN terms t ON t.id = sess.term_id
       JOIN academic_years ay ON ay.id = t.academic_year_id
       WHERE ar.student_id = $1 AND ay.is_current = TRUE`,
      [child.id]
    );
    const attRow = att[0];
    const attPct = attRow.total > 0
      ? Math.round((attRow.present / attRow.total) * 100) : null;

    // fee balance — wrapped in try/catch in case migrations haven't run yet
    let feeBalance = 0;
    try {
      const { rows: fee } = await pool.query(
        `SELECT COALESCE(SUM(fi.balance), 0) AS balance
         FROM fee_invoices fi
         JOIN terms t ON t.id = fi.term_id
         JOIN academic_years ay ON ay.id = t.academic_year_id
         WHERE fi.student_id = $1 AND ay.is_current = TRUE`,
        [child.id]
      );
      feeBalance = parseFloat(fee[0]?.balance || 0);
    } catch (_) { /* table may not exist yet */ }

    return {
      ...child,
      attendance_pct: attPct,
      fee_balance: feeBalance,
    };
  }));

  return summaries;
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION PREFERENCES
// ─────────────────────────────────────────────────────────────────────────────

const getNotificationPrefs = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM notification_preferences WHERE user_id = $1`,
    [userId]
  );
  if (rows.length) return rows[0];
  // Auto-create defaults
  const { rows: created } = await pool.query(
    `INSERT INTO notification_preferences (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );
  return created[0];
};

const updateNotificationPrefs = async (userId, prefs) => {
  const fields = [
    'email_enabled','sms_enabled','push_enabled',
    'fee_alerts','attendance_alerts','grade_alerts','announcement_alerts',
  ];
  const sets = fields.map((f, i) => `${f} = COALESCE($${i + 2}, ${f})`).join(', ');
  const vals = fields.map(f => prefs[f] !== undefined ? prefs[f] : null);
  const { rows } = await pool.query(
    `UPDATE notification_preferences SET ${sets}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
    [userId, ...vals]
  );
  if (!rows.length) {
    // insert if not exists
    await pool.query(`INSERT INTO notification_preferences (user_id) VALUES ($1)`, [userId]);
    return updateNotificationPrefs(userId, prefs);
  }
  return rows[0];
};

module.exports = {
  getParentByUserId,
  getLinkedChildren,
  getLinkedStudentIds,
  getChildProfile,
  getChildAttendance,
  getChildAttendanceSummary,
  getChildYearlyAttendance,
  getChildGrades,
  getChildUpcomingExams,
  getChildReportCards,
  getChildReportCardById,
  getAnnouncements,
  getEvents,
  rsvpEvent,
  getDashboardSummary,
  getNotificationPrefs,
  updateNotificationPrefs,
};
