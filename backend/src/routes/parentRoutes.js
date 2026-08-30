const router = require('express').Router();
const { body, param, query } = require('express-validator');

const ctrl     = require('../controllers/parentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const pool     = require('../db');
const parentService = require('../services/parentService');

// ── All parent routes require JWT + Parent role ───────────────────────────────
router.use(authenticate);
router.use(authorize('Parent'));

// ── Ownership middleware — attaches req.linkedStudentIds ──────────────────────
// This runs on every request and populates req.linkedStudentIds.
// Individual controllers / services check studentId ∈ req.linkedStudentIds.
router.use(async (req, res, next) => {
  try {
    // Resolve parent record
    const { rows } = await pool.query(
      `SELECT id FROM parents WHERE user_id = $1`,
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Parent profile not found.' });
    }
    req.parentId = rows[0].id;
    req.linkedStudentIds = await parentService.getLinkedStudentIds(req.parentId);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Param-level ownership guard for :studentId routes ────────────────────────
router.param('studentId', (req, res, next, studentId) => {
  if (!req.linkedStudentIds.includes(studentId)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied — this student is not linked to your account.',
    });
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ─────────────────────────────────────────────────────────────────────────────
// Children
// ─────────────────────────────────────────────────────────────────────────────
router.get('/children', ctrl.getChildren);
router.get('/children/:studentId/profile',      ctrl.getChildProfile);

router.get(
  '/children/:studentId/attendance',
  [
    query('year').optional().isInt({ min: 2000, max: 2100 }),
    query('month').optional().isInt({ min: 1, max: 12 }),
  ],
  validate,
  ctrl.getChildAttendance
);

router.get('/children/:studentId/grades',                       ctrl.getChildGrades);
router.get('/children/:studentId/report-cards',                 ctrl.getChildReportCards);
router.get('/children/:studentId/report-cards/:id',             ctrl.getChildReportCardById);

// ─────────────────────────────────────────────────────────────────────────────
// Fees
// ─────────────────────────────────────────────────────────────────────────────
router.get('/fees',                   ctrl.getFees);
router.get('/fees/:invoiceId',        ctrl.getFeeById);
router.post(
  '/fees/:invoiceId/pay',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number.'),
    body('method').optional().isIn(['CASH','BANK_TRANSFER','MOBILE_MONEY','CARD','CHEQUE','GATEWAY']),
  ],
  validate,
  ctrl.initiatePayment
);

// ─────────────────────────────────────────────────────────────────────────────
// Announcements & Events
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  '/announcements',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.getAnnouncements
);

router.get('/events', ctrl.getEvents);
router.post(
  '/events/:id/rsvp',
  [body('response').optional().isIn(['ATTENDING','NOT_ATTENDING','MAYBE'])],
  validate,
  ctrl.rsvpEvent
);

// ─────────────────────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────────────────────
router.get('/messages',                         ctrl.getMessages);
router.get('/messages/:conversationId',         ctrl.getConversation);
router.post(
  '/messages',
  [
    body('teacher_user_id').isUUID().withMessage('Valid teacher_user_id required.'),
    body('student_id').isUUID().withMessage('Valid student_id required.'),
    body('message').isString().trim().notEmpty().withMessage('Message body required.'),
    body('subject').optional().isString().trim(),
  ],
  validate,
  ctrl.startConversation
);
router.post(
  '/messages/:conversationId',
  [body('body').isString().trim().notEmpty().withMessage('Message body required.')],
  validate,
  ctrl.sendMessage
);

// ─────────────────────────────────────────────────────────────────────────────
// Profile & Notification Preferences
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile',                     ctrl.getProfile);
router.patch(
  '/notification-preferences',
  [
    body('email_enabled').optional().isBoolean(),
    body('sms_enabled').optional().isBoolean(),
    body('push_enabled').optional().isBoolean(),
    body('fee_alerts').optional().isBoolean(),
    body('attendance_alerts').optional().isBoolean(),
    body('grade_alerts').optional().isBoolean(),
    body('announcement_alerts').optional().isBoolean(),
  ],
  validate,
  ctrl.updateNotificationPrefs
);

module.exports = router;
