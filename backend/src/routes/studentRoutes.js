const router = require('express').Router();
const { body, query } = require('express-validator');

const ctrl     = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All student routes require a valid JWT + Student role
router.use(authenticate);
router.use(authorize('Student'));

// ── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile',   ctrl.getProfile);

router.patch(
  '/profile',
  [
    body('address').optional().isString().trim().notEmpty().withMessage('Address cannot be blank.'),
    body('emergency_contact_name').optional().isString().trim().notEmpty(),
    body('emergency_contact_phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
    body('profile_photo').optional().isURL().withMessage('profile_photo must be a valid URL.'),
  ],
  validate,
  ctrl.updateProfile
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Enrollment history ────────────────────────────────────────────────────────
router.get('/enrollment-history', ctrl.getEnrollmentHistory);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get(
  '/attendance',
  [
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year.'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be 1–12.'),
  ],
  validate,
  ctrl.getAttendance
);

// ── Timetable ─────────────────────────────────────────────────────────────────
router.get('/timetable', ctrl.getTimetable);

// ── Subjects ──────────────────────────────────────────────────────────────────
router.get('/subjects', ctrl.getSubjects);

// ── Exams & grades ────────────────────────────────────────────────────────────
router.get('/exams', ctrl.getExams);

// ── Report cards ──────────────────────────────────────────────────────────────
router.get('/report-cards',     ctrl.getReportCards);
router.get('/report-cards/:id', ctrl.getReportCardById);

// ── Fees ──────────────────────────────────────────────────────────────────────
router.get('/fees',     ctrl.getFees);
router.get('/fees/:id', ctrl.getFeeInvoiceById);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get(
  '/announcements',
  [
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1–50.'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be >= 0.'),
  ],
  validate,
  ctrl.getAnnouncements
);
router.get('/announcements/:id', ctrl.getAnnouncementById);

module.exports = router;
