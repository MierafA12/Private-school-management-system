const studentService = require('../services/studentService');
const pool = require('../db');

// ─── Helper: get student record from the authenticated user ───────────────────
const resolveStudent = async (userId) => {
  const profile = await studentService.getProfileByUserId(userId);
  if (!profile) {
    const err = new Error('Student profile not found.');
    err.status = 404;
    throw err;
  }
  return profile;
};

// ─── Helper: get active term for current academic year ────────────────────────
const resolveCurrentTerm = async () => {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.academic_year_id
     FROM terms t
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE ay.is_current = TRUE
       AND t.status = 'ACTIVE'
     ORDER BY t.start_date
     LIMIT 1`
  );
  return rows[0] || null;
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/profile
// ═════════════════════════════════════════════════════════════════════════════
const getProfile = async (req, res, next) => {
  try {
    const profile    = await studentService.getProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const enrollment = await studentService.getCurrentEnrollment(profile.id);
    const parents    = await studentService.getMyParents(profile.id);
    const advisor    = enrollment
      ? await studentService.getClassAdvisor(enrollment.section_id, enrollment.academic_year_id)
      : null;

    res.json({ success: true, data: { profile, enrollment, parents, advisor } });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/student/profile
// ═════════════════════════════════════════════════════════════════════════════
const updateProfile = async (req, res, next) => {
  try {
    const updated = await studentService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/dashboard
// ═════════════════════════════════════════════════════════════════════════════
const getDashboard = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);
    const term       = await resolveCurrentTerm();

    let summary = { attendance_percentage: null, subject_count: 0, fee_outstanding: null };
    if (enrollment && term) {
      summary = await studentService.getDashboardSummary(profile.id, enrollment.enrollment_id, term.id);
    }

    // Recent 5 attendance records
    let recentAttendance = [];
    if (term) {
      const month = new Date().getMonth() + 1;
      const year  = new Date().getFullYear();
      const all   = await studentService.getMonthlyAttendance(profile.id, year, month);
      recentAttendance = all.slice(-5).reverse();
    }

    // Upcoming exams (next 5)
    let upcomingExams = [];
    if (enrollment && term) {
      const exams = await studentService.getUpcomingExams(enrollment.section_id, term.id);
      upcomingExams = exams.slice(0, 5);
    }

    // Class advisor
    let advisor = null;
    if (enrollment) {
      advisor = await studentService.getClassAdvisor(
        enrollment.section_id, enrollment.academic_year_id
      );
    }

    res.json({
      success: true,
      data: {
        student:           { name: `${profile.first_name} ${profile.last_name}`, ...profile },
        enrollment,
        term,
        summary,
        advisor,
        recent_attendance: recentAttendance,
        upcoming_exams:    upcomingExams,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/attendance?year=2026&month=7
// ═════════════════════════════════════════════════════════════════════════════
const getAttendance = async (req, res, next) => {
  try {
    const profile = await resolveStudent(req.user.id);
    const term    = await resolveCurrentTerm();

    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    const [monthly, termSummary, yearly] = await Promise.all([
      studentService.getMonthlyAttendance(profile.id, year, month),
      term ? studentService.getTermAttendanceSummary(profile.id, term.id) : [],
      term ? studentService.getYearlyAttendanceSummary(profile.id, term.academic_year_id) : [],
    ]);

    res.json({
      success: true,
      data: {
        monthly_records: monthly,
        term_summary:    termSummary,
        yearly_summary:  yearly,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/timetable
// ═════════════════════════════════════════════════════════════════════════════
const getTimetable = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);
    const term       = await resolveCurrentTerm();

    if (!enrollment || !term) {
      return res.json({ success: true, data: { timetable: [], grouped: {}, term: null, enrollment: null, advisor: null } });
    }

    const [timetable, advisor] = await Promise.all([
      studentService.getTimetable(enrollment.section_id, term.id),
      studentService.getClassAdvisor(enrollment.section_id, enrollment.academic_year_id),
    ]);

    // Group by day for easier frontend rendering
    const grouped = {};
    for (const slot of timetable) {
      if (!grouped[slot.day_of_week]) grouped[slot.day_of_week] = [];
      grouped[slot.day_of_week].push(slot);
    }

    res.json({ success: true, data: { timetable, grouped, term, enrollment, advisor } });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/subjects
// ═════════════════════════════════════════════════════════════════════════════
const getSubjects = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);

    if (!enrollment) {
      return res.json({ success: true, data: [] });
    }

    const subjects = await studentService.getMySubjects(
      enrollment.section_id,
      enrollment.academic_year_id
    );

    res.json({ success: true, data: subjects });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/exams
// ═════════════════════════════════════════════════════════════════════════════
const getExams = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);
    const term       = await resolveCurrentTerm();

    if (!enrollment || !term) {
      return res.json({ success: true, data: { upcoming: [], results: [] } });
    }

    const [upcoming, results] = await Promise.all([
      studentService.getUpcomingExams(enrollment.section_id, term.id),
      studentService.getExamResults(profile.id, term.id),
    ]);

    res.json({ success: true, data: { upcoming, results } });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/report-cards
// ═════════════════════════════════════════════════════════════════════════════
const getReportCards = async (req, res, next) => {
  try {
    const profile     = await resolveStudent(req.user.id);
    const reportCards = await studentService.getReportCards(profile.id);
    res.json({ success: true, data: reportCards });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/report-cards/:id
// ═════════════════════════════════════════════════════════════════════════════
const getReportCardById = async (req, res, next) => {
  try {
    const profile = await resolveStudent(req.user.id);
    const card    = await studentService.getReportCardById(req.params.id, profile.id);

    if (!card) {
      return res.status(404).json({ success: false, message: 'Report card not found or not published.' });
    }

    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/enrollment-history
// ═════════════════════════════════════════════════════════════════════════════
const getEnrollmentHistory = async (req, res, next) => {
  try {
    const profile = await resolveStudent(req.user.id);
    const history = await studentService.getEnrollmentHistory(profile.id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/fees
// ═════════════════════════════════════════════════════════════════════════════
const getFees = async (req, res, next) => {
  try {
    const profile = await resolveStudent(req.user.id);
    const term    = await resolveCurrentTerm();

    const [invoices, summary] = await Promise.all([
      studentService.getFeeInvoices(profile.id),
      term
        ? studentService.getCurrentTermFeeSummary(profile.id, term.id)
        : { total_billed: 0, total_paid: 0, total_balance: 0, overdue_count: 0 },
    ]);

    res.json({ success: true, data: { summary, invoices } });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/fees/:id
// ═════════════════════════════════════════════════════════════════════════════
const getFeeInvoiceById = async (req, res, next) => {
  try {
    const profile  = await resolveStudent(req.user.id);
    const invoice  = await studentService.getFeeInvoiceById(req.params.id, profile.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/announcements
// ═════════════════════════════════════════════════════════════════════════════
const getAnnouncements = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);

    const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
    const offset = parseInt(req.query.offset) || 0;

    const classId = enrollment?.class_id || null;
    const items   = await studentService.getAnnouncements(classId, { limit, offset });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/student/announcements/:id
// ═════════════════════════════════════════════════════════════════════════════
const getAnnouncementById = async (req, res, next) => {
  try {
    const profile    = await resolveStudent(req.user.id);
    const enrollment = await studentService.getCurrentEnrollment(profile.id);
    const classId    = enrollment?.class_id || null;

    const item = await studentService.getAnnouncementById(req.params.id, classId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getAttendance,
  getTimetable,
  getSubjects,
  getExams,
  getReportCards,
  getReportCardById,
  getEnrollmentHistory,
  getFees,
  getFeeInvoiceById,
  getAnnouncements,
  getAnnouncementById,
};
