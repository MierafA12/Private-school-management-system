const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a student's full profile by their users.id
 */
const getProfileByUserId = async (userId) => {
  const { rows } = await pool.query(
    `SELECT
       s.id,
       s.student_number,
       s.admission_number,
       s.first_name,
       s.middle_name,
       s.last_name,
       s.gender,
       s.date_of_birth,
       s.blood_group,
       s.nationality,
       s.religion,
       s.profile_photo,
       s.address,
       s.emergency_contact_name,
       s.emergency_contact_phone,
       s.admission_date,
       s.previous_school,
       s.current_status,
       u.email,
       u.phone
     FROM students s
     JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1`,
    [userId]
  );
  return rows[0] || null;
};

/**
 * Update editable profile fields
 */
const updateProfile = async (userId, fields) => {
  const { address, emergency_contact_name, emergency_contact_phone, profile_photo } = fields;
  const { rows } = await pool.query(
    `UPDATE students
     SET address                 = COALESCE($1, address),
         emergency_contact_name  = COALESCE($2, emergency_contact_name),
         emergency_contact_phone = COALESCE($3, emergency_contact_phone),
         profile_photo           = COALESCE($4, profile_photo),
         updated_at              = NOW()
     WHERE user_id = $5
     RETURNING *`,
    [address, emergency_contact_name, emergency_contact_phone, profile_photo, userId]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// CURRENT ENROLLMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the student's active enrollment (current academic year)
 */
const getCurrentEnrollment = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       e.id AS enrollment_id,
       e.roll_number,
       e.enrollment_date,
       e.enrollment_status,
       ay.id   AS academic_year_id,
       ay.name AS academic_year,
       c.id    AS class_id,
       c.name  AS class_name,
       c.grade_level,
       sec.id  AS section_id,
       sec.name AS section_name
     FROM enrollments e
     JOIN academic_years ay ON ay.id = e.academic_year_id
     JOIN classes        c  ON c.id  = e.class_id
     JOIN sections       sec ON sec.id = e.section_id
     WHERE e.student_id = $1
       AND ay.is_current = TRUE
       AND e.enrollment_status = 'ACTIVE'
     LIMIT 1`,
    [studentId]
  );
  return rows[0] || null;
};

/**
 * Get full enrollment history for a student
 */
const getEnrollmentHistory = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       e.id,
       e.roll_number,
       e.enrollment_date,
       e.enrollment_status,
       ay.name AS academic_year,
       c.name  AS class_name,
       sec.name AS section_name
     FROM enrollments e
     JOIN academic_years ay ON ay.id = e.academic_year_id
     JOIN classes        c  ON c.id  = e.class_id
     JOIN sections       sec ON sec.id = e.section_id
     WHERE e.student_id = $1
     ORDER BY ay.start_date DESC`,
    [studentId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get dashboard summary stats:
 * attendance %, subject count, upcoming exam count, fee balance
 */
const getDashboardSummary = async (studentId, enrollmentId, termId) => {
  // Attendance % this term
  const attResult = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
       COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE ar.student_id = $1
       AND s.term_id = $2`,
    [studentId, termId]
  );
  const attRow   = attResult.rows[0];
  const attPct   = attRow.total > 0
    ? Math.round((attRow.present / attRow.total) * 100)
    : null;

  // Subjects enrolled this year
  const subjResult = await pool.query(
    `SELECT COUNT(DISTINCT t.curriculum_subject_id) AS subject_count
     FROM timetables t
     JOIN enrollments e ON e.section_id = t.section_id
       AND e.academic_year_id = t.academic_year_id
     WHERE e.id = $1`,
    [enrollmentId]
  );

  // Fee outstanding (current term)
  const feeResult = await pool.query(
    `SELECT COALESCE(SUM(balance), 0) AS outstanding
     FROM fee_invoices
     WHERE student_id = $1 AND term_id = $2`,
    [studentId, termId]
  );
  const feeOutstanding = parseFloat(feeResult.rows[0]?.outstanding || 0);

  return {
    attendance_percentage: attPct,
    subject_count:         parseInt(subjResult.rows[0]?.subject_count || 0),
    fee_outstanding:       feeOutstanding,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Monthly attendance for the student
 */
const getMonthlyAttendance = async (studentId, year, month) => {
  // month is 1-based (1=Jan)
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

/**
 * Attendance summary (counts per status) for a given term
 */
const getTermAttendanceSummary = async (studentId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       ar.attendance_status,
       COUNT(*) AS count
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     WHERE ar.student_id = $1
       AND s.term_id = $2
     GROUP BY ar.attendance_status`,
    [studentId, termId]
  );
  return rows;
};

/**
 * Monthly attendance percentage over all months of a year
 */
const getYearlyAttendanceSummary = async (studentId, academicYearId) => {
  const { rows } = await pool.query(
    `SELECT
       TO_CHAR(s.attendance_date, 'Mon YYYY') AS month,
       COUNT(*) FILTER (WHERE ar.attendance_status = 'Present') AS present,
       COUNT(*) AS total
     FROM attendance_records ar
     JOIN attendance_sessions s ON s.id = ar.attendance_session_id
     JOIN terms t ON t.id = s.term_id
     WHERE ar.student_id = $1
       AND t.academic_year_id = $2
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
// TIMETABLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Weekly timetable for the student's current enrollment
 */
const getTimetable = async (sectionId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       t.id,
       t.day_of_week,
       t.period_number,
       t.start_time,
       t.end_time,
       t.room_number,
       s.name  AS subject_name,
       s.code  AS subject_code,
       (te.first_name || ' ' || te.last_name) AS teacher_name
     FROM timetables t
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     JOIN teachers te ON te.id = t.teacher_id
     WHERE t.section_id = $1
       AND t.term_id    = $2
     ORDER BY
       CASE t.day_of_week
         WHEN 'Monday'    THEN 1
         WHEN 'Tuesday'   THEN 2
         WHEN 'Wednesday' THEN 3
         WHEN 'Thursday'  THEN 4
         WHEN 'Friday'    THEN 5
         WHEN 'Saturday'  THEN 6
         WHEN 'Sunday'    THEN 7
       END,
       t.period_number`,
    [sectionId, termId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All subjects the student is studying this year with teacher info
 */
const getMySubjects = async (sectionId, academicYearId) => {
  const { rows } = await pool.query(
    `SELECT DISTINCT
       s.id          AS subject_id,
       s.code,
       s.name        AS subject_name,
       cs.is_core,
       cs.pass_mark,
       cs.max_mark,
       cs.weekly_periods,
       (te.first_name || ' ' || te.last_name) AS teacher_name
     FROM timetables t
     JOIN curriculum_subjects cs ON cs.id = t.curriculum_subject_id
     JOIN subjects s  ON s.id  = cs.subject_id
     JOIN teachers te ON te.id = t.teacher_id
     WHERE t.section_id       = $1
       AND t.academic_year_id = $2
     ORDER BY subject_name`,
    [sectionId, academicYearId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAMS & GRADES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upcoming exam schedules for the student's class/section
 */
const getUpcomingExams = async (sectionId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       es.id,
       es.title,
       es.exam_date,
       es.start_time,
       es.end_time,
       es.venue,
       es.exam_type,
       es.max_marks,
       s.name AS subject_name
     FROM exam_schedules es
     JOIN curriculum_subjects cs ON cs.id = es.curriculum_subject_id
     JOIN subjects s ON s.id = cs.subject_id
     WHERE es.section_id   = $1
       AND es.term_id      = $2
       AND es.exam_date   >= CURRENT_DATE
     ORDER BY es.exam_date, es.start_time`,
    [sectionId, termId]
  );
  return rows;
};

/**
 * Published exam results for the student
 */
const getExamResults = async (studentId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       er.id,
       er.marks_obtained,
       er.is_absent,
       es.title,
       es.exam_type,
       es.max_marks,
       es.exam_date,
       s.name  AS subject_name,
       ROUND((er.marks_obtained::NUMERIC / es.max_marks) * 100, 1) AS percentage
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

// ─────────────────────────────────────────────────────────────────────────────
// REPORT CARDS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All published report cards for the student
 */
const getReportCards = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       rc.id,
       rc.total_marks,
       rc.total_percentage,
       rc.overall_grade,
       rc.class_rank,
       rc.advisor_remarks,
       rc.published_at,
       t.name  AS term_name,
       ay.name AS academic_year
     FROM report_cards rc
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE rc.student_id  = $1
       AND rc.is_published = TRUE
     ORDER BY rc.published_at DESC`,
    [studentId]
  );
  return rows;
};

/**
 * Single report card with subject-level marks
 */
const getReportCardById = async (reportCardId, studentId) => {
  // Fetch header
  const { rows: header } = await pool.query(
    `SELECT
       rc.*,
       t.name  AS term_name,
       ay.name AS academic_year,
       ay.start_date,
       ay.end_date
     FROM report_cards rc
     JOIN terms t ON t.id = rc.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE rc.id = $1 AND rc.student_id = $2 AND rc.is_published = TRUE`,
    [reportCardId, studentId]
  );
  if (!header.length) return null;

  // Fetch subject details
  const { rows: subjects } = await pool.query(
    `SELECT
       rci.id,
       rci.total_marks,
       rci.percentage,
       rci.letter_grade,
       rci.teacher_remarks,
       rci.is_passed,
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
// PARENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get parents linked to a student
 */
const getMyParents = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       p.id,
       p.first_name,
       p.last_name,
       p.relationship,
       p.occupation,
       p.emergency_phone,
       sp.is_primary_contact,
       u.email,
       u.phone
     FROM student_parents sp
     JOIN parents p ON p.id = sp.parent_id
     JOIN users  u ON u.id = p.user_id
     WHERE sp.student_id = $1`,
    [studentId]
  );
  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// FEES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all fee invoices for a student, most recent first
 */
const getFeeInvoices = async (studentId) => {
  const { rows } = await pool.query(
    `SELECT
       fi.id,
       fi.invoice_number,
       fi.total_amount,
       fi.amount_paid,
       fi.balance,
       fi.currency,
       fi.due_date,
       fi.status,
       fi.notes,
       fi.created_at,
       t.name  AS term_name,
       ay.name AS academic_year
     FROM fee_invoices fi
     JOIN terms        t  ON t.id  = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE fi.student_id = $1
     ORDER BY fi.created_at DESC`,
    [studentId]
  );
  return rows;
};

/**
 * Get a single invoice with its payment history
 */
const getFeeInvoiceById = async (invoiceId, studentId) => {
  const { rows: inv } = await pool.query(
    `SELECT
       fi.*,
       t.name  AS term_name,
       ay.name AS academic_year
     FROM fee_invoices fi
     JOIN terms        t  ON t.id  = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE fi.id = $1 AND fi.student_id = $2`,
    [invoiceId, studentId]
  );
  if (!inv.length) return null;

  const { rows: payments } = await pool.query(
    `SELECT
       fp.id,
       fp.amount,
       fp.payment_date,
       fp.payment_method,
       fp.transaction_reference,
       fp.notes,
       fp.created_at
     FROM fee_payments fp
     WHERE fp.fee_invoice_id = $1
     ORDER BY fp.payment_date DESC`,
    [invoiceId]
  );

  return { ...inv[0], payments };
};

/**
 * Summary of fee status for the current term
 */
const getCurrentTermFeeSummary = async (studentId, termId) => {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(fi.total_amount), 0) AS total_billed,
       COALESCE(SUM(fi.amount_paid),  0) AS total_paid,
       COALESCE(SUM(fi.balance),      0) AS total_balance,
       COUNT(*) FILTER (WHERE fi.status = 'OVERDUE') AS overdue_count
     FROM fee_invoices fi
     WHERE fi.student_id = $1
       AND fi.term_id    = $2`,
    [studentId, termId]
  );
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get active announcements visible to students.
 * Includes school-wide (ALL / STUDENTS) and class-specific ones.
 */
const getAnnouncements = async (classId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT
       a.id,
       a.title,
       a.body,
       a.audience,
       a.priority,
       a.publish_at,
       a.expires_at,
       (u.email) AS created_by_email
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     WHERE a.is_published = TRUE
       AND a.publish_at  <= NOW()
       AND (a.expires_at IS NULL OR a.expires_at > NOW())
       AND (
             a.audience IN ('ALL', 'STUDENTS')
          OR (a.audience = 'CLASS' AND a.class_id = $1)
       )
     ORDER BY
       CASE a.priority
         WHEN 'URGENT' THEN 1
         WHEN 'HIGH'   THEN 2
         WHEN 'NORMAL' THEN 3
         WHEN 'LOW'    THEN 4
       END,
       a.publish_at DESC
     LIMIT $2 OFFSET $3`,
    [classId, limit, offset]
  );
  return rows;
};

/**
 * Get a single announcement (checks it's accessible to this student's class)
 */
const getAnnouncementById = async (announcementId, classId) => {
  const { rows } = await pool.query(
    `SELECT
       a.*,
       (u.email) AS created_by_email
     FROM announcements a
     JOIN users u ON u.id = a.created_by
     WHERE a.id = $1
       AND a.is_published = TRUE
       AND a.publish_at  <= NOW()
       AND (a.expires_at IS NULL OR a.expires_at > NOW())
       AND (
             a.audience IN ('ALL', 'STUDENTS')
          OR (a.audience = 'CLASS' AND a.class_id = $2)
       )`,
    [announcementId, classId]
  );
  return rows[0] || null;
};

module.exports = {
  getProfileByUserId,
  updateProfile,
  getCurrentEnrollment,
  getEnrollmentHistory,
  getDashboardSummary,
  getMonthlyAttendance,
  getTermAttendanceSummary,
  getYearlyAttendanceSummary,
  getTimetable,
  getMySubjects,
  getUpcomingExams,
  getExamResults,
  getReportCards,
  getReportCardById,
  getMyParents,
  getFeeInvoices,
  getFeeInvoiceById,
  getCurrentTermFeeSummary,
  getAnnouncements,
  getAnnouncementById,
};
