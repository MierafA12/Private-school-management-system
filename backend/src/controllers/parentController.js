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

const initiatePayment = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { amount }    = req.body;

    // Verify invoice belongs to this parent AND get parent name + email
    const { rows } = await pool.query(
      `SELECT fi.*,
              p.first_name  AS parent_first_name,
              p.last_name   AS parent_last_name,
              u.email       AS parent_email
       FROM fee_invoices fi
       JOIN students s ON s.id = fi.student_id
       JOIN parents  p ON p.id = $2
       JOIN users    u ON u.id = p.user_id
       WHERE fi.id = $1 AND fi.student_id = ANY($3::uuid[])`,
      [invoiceId, req.parentId, req.linkedStudentIds]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const invoice = rows[0];

    if (['PAID','WAIVED','CANCELLED'].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        message: `Invoice is already ${invoice.status.toLowerCase()}.`,
      });
    }

    const payAmount = parseFloat(amount || invoice.balance);
    if (isNaN(payAmount) || payAmount <= 0 || payAmount > parseFloat(invoice.balance)) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }

    const gatewaySvc = require('../services/paymentGatewayService');
    const result = await gatewaySvc.initializeTransaction({
      invoiceId: invoice.id,
      amount:    payAmount,
      currency:  invoice.currency || 'ETB',
      email:     invoice.parent_email || 'parent@school.com',
      firstName: invoice.parent_first_name || 'Parent',
      lastName:  invoice.parent_last_name  || 'User',
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════════
// POST /api/parent/fees/verify-payment
// Called by the frontend after Chapa redirects back.
// Asks Chapa to verify the tx_ref, then records the payment if successful.
// Safe to call multiple times — processSuccessfulPayment() is idempotent.
// ═══════════════════════════════════════════════════════════════════════
const verifyPayment = async (req, res, next) => {
  try {
    const { tx_ref, invoice_id } = req.body;

    if (!tx_ref) {
      return res.status(400).json({ success: false, message: 'tx_ref is required.' });
    }

    // Ownership check — make sure the invoice belongs to this parent
    if (invoice_id) {
      const { rows: invRows } = await pool.query(
        `SELECT id FROM fee_invoices
         WHERE id = $1 AND student_id = ANY($2::uuid[])`,
        [invoice_id, req.linkedStudentIds]
      );
      if (!invRows.length) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const gatewaySvc = require('../services/paymentGatewayService');

    // 1. Ask Chapa if this transaction succeeded
    let chapaData;
    let chapaError = null;
    try {
      chapaData = await gatewaySvc.verifyTransaction(tx_ref);
      console.log('[verifyPayment] Chapa response for tx_ref', tx_ref, ':', JSON.stringify(chapaData).slice(0, 300));
    } catch (err) {
      chapaError = err.message;
      console.warn('[verifyPayment] Chapa verify failed for tx_ref', tx_ref, ':', err.message);
    }

    // If Chapa call failed, check DB gateway_status as fallback
    if (!chapaData) {
      const { rows: invCheck } = await pool.query(
        `SELECT id, status, gateway_status, amount_paid FROM fee_invoices WHERE tx_ref = $1`,
        [tx_ref]
      );
      if (invCheck.length) {
        const inv = invCheck[0];
        if (inv.status === 'PAID' || inv.gateway_status === 'SUCCESS') {
          return res.json({
            success: true,
            data: { verified: true, status: 'success', duplicate: true, message: 'Payment already recorded.' },
          });
        }
        if (inv.gateway_status === 'PENDING') {
          return res.json({
            success: true,
            data: { verified: false, status: 'pending', message: 'Payment is being processed. Please wait a moment and refresh.' },
          });
        }
      }
      return res.status(200).json({
        success: true,
        data: { verified: false, status: 'unknown', message: chapaError || 'Chapa could not verify this transaction.' },
      });
    }

    const chapaStatus = (chapaData?.status || chapaData?.data?.status || '').toLowerCase();

    if (chapaStatus === 'abandoned') {
      // Payment was opened on Chapa but never completed — clear PENDING flag
      if (invoice_id) {
        await pool.query(
          `UPDATE fee_invoices SET gateway_status='ABANDONED', updated_at=NOW() WHERE id=$1`,
          [invoice_id]
        ).catch(() => {});
      }
      return res.json({
        success: true,
        data: { verified: false, status: 'abandoned', message: 'Payment was not completed on Chapa.' },
      });
    }

    if (chapaStatus === 'success') {
      // 2. Record the payment (idempotent — safe if already recorded)
      const result = await gatewaySvc.processSuccessfulPayment(tx_ref, chapaData);

      return res.json({
        success: true,
        data: {
          verified:      true,
          status:        'success',
          duplicate:     result.duplicate || false,
          invoice_id:    result.invoice_id,
          receipt_number: result.receipt_number || null,
          message:       result.duplicate
            ? 'Payment was already recorded.'
            : 'Payment confirmed and recorded.',
        },
      });
    }

    if (chapaStatus === 'pending') {
      return res.json({
        success: true,
        data: { verified: false, status: 'pending', message: 'Payment is still being processed by Chapa.' },
      });
    }

    // failed / cancelled / anything else
    // Update gateway_status on the invoice so UI reflects it
    if (invoice_id) {
      await pool.query(
        `UPDATE fee_invoices
         SET gateway_status = $1, updated_at = NOW()
         WHERE id = $2`,
        [chapaStatus === 'cancelled' ? 'CANCELLED' : 'FAILED', invoice_id]
      );
    }

    return res.json({
      success: true,
      data: { verified: false, status: chapaStatus || 'failed', message: 'Payment was not successful.' },
    });
  } catch (err) {
    next(err);
  }
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
  getFees, getFeeById, initiatePayment, verifyPayment,
  getAnnouncements, getEvents, rsvpEvent,
  getMessages, getConversation, startConversation, sendMessage,
  getProfile, updateNotificationPrefs,
};
