const parentService    = require('../services/parentService');
const feeService       = require('../services/feeService');
const messagingService = require('../services/messagingService');
const gatewaySvc       = require('../services/paymentGatewayService');
const pool             = require('../db');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve parent record from authenticated user — throws 404 if not found */
const resolveParent = async (userId) => {
  const parent = await parentService.getParentByUserId(userId);
  if (!parent) {
    const err = new Error('Parent profile not found.'); err.status = 404; throw err;
  }
  return parent;
};

/** Get active term */
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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children
// ═════════════════════════════════════════════════════════════════════════════
const getChildren = async (req, res, next) => {
  try {
    const parent = await resolveParent(req.user.id);
    const children = await parentService.getLinkedChildren(parent.id);
    res.json({ success: true, data: children });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/profile
// ═════════════════════════════════════════════════════════════════════════════
const getChildProfile = async (req, res, next) => {
  try {
    const profile = await parentService.getChildProfile(
      req.params.studentId, req.linkedStudentIds
    );
    if (!profile) return res.status(404).json({ success: false, message: 'Child not found.' });
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/dashboard
// ═════════════════════════════════════════════════════════════════════════════
const getDashboard = async (req, res, next) => {
  try {
    const parent   = await resolveParent(req.user.id);
    const children = await parentService.getDashboardSummary(parent.id);
    const term     = await resolveCurrentTerm();

    // Recent announcements
    const classIds = children.map(c => c.class_id).filter(Boolean);
    const announcements = await parentService.getAnnouncements(classIds, { limit: 5 });

    res.json({
      success: true,
      data: {
        parent: { first_name: parent.first_name, last_name: parent.last_name },
        children,
        term,
        recent_announcements: announcements,
      },
    });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/attendance
// ═════════════════════════════════════════════════════════════════════════════
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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/grades
// ═════════════════════════════════════════════════════════════════════════════
const getChildGrades = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const term = await resolveCurrentTerm();
    if (!term) return res.json({ success: true, data: { results: [], upcoming: [] } });

    // Get student's enrollment to find section for upcoming exams
    const { rows: enroll } = await pool.query(
      `SELECT section_id FROM enrollments
       WHERE student_id = $1 AND enrollment_status = 'ACTIVE'
       AND academic_year_id = (SELECT id FROM academic_years WHERE is_current = TRUE LIMIT 1)
       LIMIT 1`,
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

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/report-cards
// ═════════════════════════════════════════════════════════════════════════════
const getChildReportCards = async (req, res, next) => {
  try {
    const cards = await parentService.getChildReportCards(req.params.studentId);
    res.json({ success: true, data: cards });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/children/:studentId/report-cards/:id
// ═════════════════════════════════════════════════════════════════════════════
const getChildReportCardById = async (req, res, next) => {
  try {
    const card = await parentService.getChildReportCardById(req.params.id, req.params.studentId);
    if (!card) return res.status(404).json({ success: false, message: 'Report card not found.' });
    res.json({ success: true, data: card });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/fees
// ═════════════════════════════════════════════════════════════════════════════
const getFees = async (req, res, next) => {
  try {
    const invoices = await feeService.getInvoicesByStudentIds(req.linkedStudentIds);
    const summary  = invoices.reduce(
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
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/fees/:invoiceId
// With fallback verify: if tx_ref exists and gateway_status=PENDING, call Chapa
// ═════════════════════════════════════════════════════════════════════════════
const getFeeById = async (req, res, next) => {
  try {
    let invoice = await feeService.getInvoiceById(req.params.invoiceId, req.linkedStudentIds);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });

    // Fallback verify: if Chapa payment is still PENDING, check with Chapa now
    if (invoice.tx_ref && invoice.gateway_status === 'PENDING') {
      try {
        const chapaData = await gatewaySvc.verifyTransaction(invoice.tx_ref);
        if (chapaData?.status === 'success') {
          await gatewaySvc.processSuccessfulPayment(invoice.tx_ref, chapaData);
          // Re-fetch updated invoice
          invoice = await feeService.getInvoiceById(req.params.invoiceId, req.linkedStudentIds);
        }
      } catch (_) {
        // Verification failed silently — return current invoice state
      }
    }

    res.json({ success: true, data: invoice });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/parent/fees/:invoiceId/pay
// Initialises a Chapa transaction and returns the hosted checkout URL
// ═════════════════════════════════════════════════════════════════════════════
const initiatePayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    // Verify invoice ownership
    const invoice = await feeService.getInvoiceById(req.params.invoiceId, req.linkedStudentIds);
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found.' });
    if (['PAID','WAIVED','CANCELLED'].includes(invoice.status)) {
      return res.status(400).json({ success: false, message: `Invoice is already ${invoice.status.toLowerCase()}.` });
    }
    if (parseFloat(amount) > parseFloat(invoice.balance)) {
      return res.status(400).json({ success: false, message: 'Amount exceeds outstanding balance.' });
    }

    // Get parent contact info for Chapa
    const parent = await parentService.getParentByUserId(req.user.id);
    const { rows: userRows } = await pool.query(
      `SELECT email FROM users WHERE id = $1`, [req.user.id]
    );

    const result = await gatewaySvc.initializeTransaction({
      invoiceId:  invoice.id,
      amount:     parseFloat(amount),
      currency:   invoice.currency || 'ETB',
      email:      userRows[0]?.email || 'parent@school.com',
      firstName:  parent?.first_name || 'Parent',
      lastName:   parent?.last_name  || 'User',
    });

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/announcements
// ═════════════════════════════════════════════════════════════════════════════
const getAnnouncements = async (req, res, next) => {
  try {
    const parent   = await resolveParent(req.user.id);
    const children = await parentService.getLinkedChildren(parent.id);
    const classIds = children.map(c => c.class_id).filter(Boolean);
    const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset   = parseInt(req.query.offset) || 0;
    const items    = await parentService.getAnnouncements(classIds, { limit, offset });
    res.json({ success: true, data: items });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/parent/events
// ═════════════════════════════════════════════════════════════════════════════
const getEvents = async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const events = await parentService.getEvents({ limit, offset });
    res.json({ success: true, data: events });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/parent/events/:id/rsvp
// ═════════════════════════════════════════════════════════════════════════════
const rsvpEvent = async (req, res, next) => {
  try {
    const { response = 'ATTENDING' } = req.body;
    const result = await parentService.rsvpEvent(req.params.id, req.user.id, response);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// MESSAGING
// ═════════════════════════════════════════════════════════════════════════════
const getMessages = async (req, res, next) => {
  try {
    const convs = await messagingService.getConversations(req.user.id);
    res.json({ success: true, data: convs });
  } catch (err) { next(err); }
};

const getConversation = async (req, res, next) => {
  try {
    const conv = await messagingService.getConversationById(req.params.conversationId, req.user.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found.' });
    res.json({ success: true, data: conv });
  } catch (err) { next(err); }
};

const startConversation = async (req, res, next) => {
  try {
    const { teacher_user_id, student_id, subject, message } = req.body;
    if (!teacher_user_id || !student_id || !message) {
      return res.status(400).json({ success: false, message: 'teacher_user_id, student_id, and message are required.' });
    }
    const result = await messagingService.startConversation(
      req.user.id, teacher_user_id, student_id, subject, message, req.linkedStudentIds
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

const sendMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return res.status(400).json({ success: false, message: 'Message body is required.' });
    const msg = await messagingService.sendMessage(req.params.conversationId, req.user.id, body.trim());
    res.status(201).json({ success: true, data: msg });
  } catch (err) { next(err); }
};

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE & NOTIFICATION PREFERENCES
// ═════════════════════════════════════════════════════════════════════════════
const getProfile = async (req, res, next) => {
  try {
    const parent = await resolveParent(req.user.id);
    const prefs  = await parentService.getNotificationPrefs(req.user.id);
    res.json({ success: true, data: { parent, notification_preferences: prefs } });
  } catch (err) { next(err); }
};

const updateNotificationPrefs = async (req, res, next) => {
  try {
    const prefs = await parentService.updateNotificationPrefs(req.user.id, req.body);
    res.json({ success: true, data: prefs });
  } catch (err) { next(err); }
};

module.exports = {
  getChildren,
  getChildProfile,
  getDashboard,
  getChildAttendance,
  getChildGrades,
  getChildReportCards,
  getChildReportCardById,
  getFees,
  getFeeById,
  initiatePayment,
  getAnnouncements,
  getEvents,
  rsvpEvent,
  getMessages,
  getConversation,
  startConversation,
  sendMessage,
  getProfile,
  updateNotificationPrefs,
};
