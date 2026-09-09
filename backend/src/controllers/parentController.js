const parentService    = require('../services/parentService');
const pool             = require('../db');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const resolveParent = async (userId) => {
  const parent = await parentService.getParentByUserId(userId);
  if (!parent) { const e = new Error('Parent profile not found.'); e.status = 404; throw e; }
  return parent;
};

const resolveCurrentTerm = async () => {
  const { rows } = await pool.query(
    `SELECT t.id, t.name, t.academic_year_id
     FROM terms t
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE ay.is_current = TRUE AND t.status = 'ACTIVE'
     ORDER BY t.start_date LIMIT 1`
  );
  return rows[0] || null;
};

// Safe wrapper — missing-table errors return empty fallback instead of 500
const safe = (fn, fallback) => async (req, res, next) => {
  try { await fn(req, res, next); }
  catch (err) {
    if (err.code === '42P01' || err.message?.includes('does not exist')) {
      return res.json({ success: true, data: fallback });
    }
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/children
// ═══════════════════════════════════════════════════════════════════════
const getChildren = async (req, res, next) => {
  try {
    const parent = await resolveParent(req.user.id);
    res.json({ success: true, data: await parentService.getLinkedChildren(parent.id) });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/profile
// ═══════════════════════════════════════════════════════════════════════
const getChildProfile = async (req, res, next) => {
  try {
    const profile = await parentService.getChildProfile(req.params.studentId, req.linkedStudentIds);
    if (!profile) return res.status(404).json({ success: false, message: 'Child not found.' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/dashboard
// ═══════════════════════════════════════════════════════════════════════
const getDashboard = async (req, res, next) => {
  try {
    const parent   = await resolveParent(req.user.id);
    const children = await parentService.getDashboardSummary(parent.id);
    const term     = await resolveCurrentTerm();

    const classIds = children.map(c => c.class_id).filter(Boolean);
    let announcements = [];
    try { announcements = await parentService.getAnnouncements(classIds, { limit: 5 }); } catch (_) {}

    res.json({
      success: true,
      data: {
        parent: { first_name: parent.first_name, last_name: parent.last_name },
        children, term, recent_announcements: announcements,
      },
    });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/attendance
// ═══════════════════════════════════════════════════════════════════════
const getChildAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const term  = await resolveCurrentTerm();
    const [monthly, termSummary, yearly] = await Promise.all([
      parentService.getChildAttendance(studentId, year, month),
      term ? parentService.getChildAttendanceSummary(studentId, term.id) : [],
      term ? parentService.getChildYearlyAttendance(studentId, term.academic_year_id) : [],
    ]);
    res.json({ success: true, data: { monthly_records: monthly, term_summary: termSummary, yearly_summary: yearly } });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/grades
// ═══════════════════════════════════════════════════════════════════════
const getChildGrades = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const term = await resolveCurrentTerm();
    if (!term) return res.json({ success: true, data: { results: [], upcoming: [] } });
    const { rows: enroll } = await pool.query(
      `SELECT section_id FROM enrollments WHERE student_id = $1 AND enrollment_status = 'ACTIVE'
       AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1) LIMIT 1`,
      [studentId]
    );
    const sectionId = enroll[0]?.section_id;
    const [results, upcoming] = await Promise.all([
      parentService.getChildGrades(studentId, term.id),
      sectionId ? parentService.getChildUpcomingExams(sectionId, term.id) : [],
    ]);
    res.json({ success: true, data: { results, upcoming, term } });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/report-cards
// ═══════════════════════════════════════════════════════════════════════
const getChildReportCards = safe(async (req, res) => {
  const cards = await parentService.getChildReportCards(req.params.studentId);
  res.json({ success: true, data: cards });
}, []);

const getChildReportCardById = async (req, res, next) => {
  try {
    const card = await parentService.getChildReportCardById(req.params.id, req.params.studentId);
    if (!card) return res.status(404).json({ success: false, message: 'Report card not found.' });
    res.json({ success: true, data: card });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/fees
// ═══════════════════════════════════════════════════════════════════════
const getFees = safe(async (req, res) => {
  // Query fee_invoices directly (safe wrapper catches table-missing error)
  const { rows: invoices } = await pool.query(
    `SELECT fi.*, t.name AS term_name, ay.name AS academic_year,
            s.first_name, s.last_name, s.student_number
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students s ON s.id = fi.student_id
     WHERE fi.student_id = ANY($1::uuid[])
     ORDER BY fi.created_at DESC`,
    [req.linkedStudentIds]
  );
  const summary = invoices.reduce(
    (acc, inv) => {
      acc.total_billed  += parseFloat(inv.total_amount || 0);
      acc.total_paid    += parseFloat(inv.amount_paid  || 0);
      acc.total_balance += parseFloat(inv.balance      || 0);
      if (inv.status === 'OVERDUE') acc.overdue_count++;
      return acc;
    },
    { total_billed: 0, total_paid: 0, total_balance: 0, overdue_count: 0 }
  );
  res.json({ success: true, data: { summary, invoices } });
}, { summary: { total_billed: 0, total_paid: 0, total_balance: 0, overdue_count: 0 }, invoices: [] });

const getFeeById = safe(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT fi.*, t.name AS term_name, ay.name AS academic_year
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE fi.id = $1 AND fi.student_id = ANY($2::uuid[])`,
    [req.params.invoiceId, req.linkedStudentIds]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Invoice not found.' });
  res.json({ success: true, data: rows[0] });
}, null);

const initiatePayment = async (req, res) => {
  res.json({ success: false, message: 'Online payment gateway not yet configured.' });
};

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/announcements
// ═══════════════════════════════════════════════════════════════════════
const getAnnouncements = safe(async (req, res) => {
  const parent   = await resolveParent(req.user.id);
  const children = await parentService.getLinkedChildren(parent.id);
  const classIds = children.map(c => c.class_id).filter(Boolean);
  const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  res.json({ success: true, data: await parentService.getAnnouncements(classIds, { limit, offset }) });
}, []);

// ═══════════════════════════════════════════════════════════════════════
// GET /api/parent/events — returns empty if table doesn't exist
// ═══════════════════════════════════════════════════════════════════════
const getEvents = safe(async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  res.json({ success: true, data: await parentService.getEvents({ limit, offset, userId: req.user.id }) });
}, []);

const rsvpEvent = safe(async (req, res) => {
  const result = await parentService.rsvpEvent(req.params.id, req.user.id, req.body.response || 'ATTENDING');
  res.json({ success: true, data: result });
}, null);

// ═══════════════════════════════════════════════════════════════════════
// MESSAGES — returns empty if table doesn't exist
// ═══════════════════════════════════════════════════════════════════════
const getMessages = safe(async (req, res) => {
  const messagingService = require('../services/messagingService');
  res.json({ success: true, data: await messagingService.getConversations(req.user.id) });
}, []);

const getConversation = safe(async (req, res) => {
  const messagingService = require('../services/messagingService');
  const conv = await messagingService.getConversationById(req.params.conversationId, req.user.id);
  if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
  res.json({ success: true, data: conv });
}, null);

const startConversation = safe(async (req, res) => {
  const messagingService = require('../services/messagingService');
  const { teacher_user_id, student_id, subject, message } = req.body;
  if (!teacher_user_id || !student_id || !message) {
    return res.status(400).json({ success: false, message: 'teacher_user_id, student_id, and message are required.' });
  }
  const result = await messagingService.startConversation(
    req.user.id, teacher_user_id, student_id, subject, message, req.linkedStudentIds
  );
  res.status(201).json({ success: true, data: result });
}, null);

const sendMessage = safe(async (req, res) => {
  const messagingService = require('../services/messagingService');
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ success: false, message: 'Message body is required.' });
  const msg = await messagingService.sendMessage(req.params.conversationId, req.user.id, body.trim());
  res.status(201).json({ success: true, data: msg });
}, null);

// ═══════════════════════════════════════════════════════════════════════
// PROFILE & NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════════════════════════════════
const getProfile = safe(async (req, res) => {
  const parent = await resolveParent(req.user.id);
  let prefs = {};
  try { prefs = await parentService.getNotificationPrefs(req.user.id); } catch (_) {}
  res.json({ success: true, data: { parent, notification_preferences: prefs } });
}, { parent: null, notification_preferences: {} });

const updateNotificationPrefs = safe(async (req, res) => {
  const prefs = await parentService.updateNotificationPrefs(req.user.id, req.body);
  res.json({ success: true, data: prefs });
}, {});

module.exports = {
  getChildren, getChildProfile, getDashboard,
  getChildAttendance, getChildGrades,
  getChildReportCards, getChildReportCardById,
  getFees, getFeeById, initiatePayment,
  getAnnouncements, getEvents, rsvpEvent,
  getMessages, getConversation, startConversation, sendMessage,
  getProfile, updateNotificationPrefs,
};
