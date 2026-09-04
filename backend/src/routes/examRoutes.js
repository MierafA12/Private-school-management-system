const router = require('express').Router();
const { body, query } = require('express-validator');

const ctrl = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All exam endpoints require authentication
router.use(authenticate);

// ── Exam schedules ────────────────────────────────────────────────────────────
router.get('/schedules', ctrl.getSchedules);
router.get('/schedules/:id', ctrl.getScheduleById);

router.post(
  '/schedules',
  authorize('Teacher', 'Principal', 'Super Admin'),
  [
    body('title').notEmpty().withMessage('title is required.'),
    body('academic_year_id').isUUID().withMessage('valid academic_year_id required.'),
    body('term_id').isUUID().withMessage('valid term_id required.'),
    body('class_id').isUUID().withMessage('valid class_id required.'),
    body('section_id').isUUID().withMessage('valid section_id required.'),
    body('curriculum_subject_id').isUUID().withMessage('valid curriculum_subject_id required.'),
    body('exam_date').isDate().withMessage('valid exam_date required.'),
  ],
  validate,
  ctrl.createSchedule
);

router.patch(
  '/schedules/:id',
  authorize('Teacher', 'Principal', 'Super Admin'),
  [
    body('exam_date').optional().isDate(),
  ],
  validate,
  ctrl.updateSchedule
);

router.delete(
  '/schedules/:id',
  authorize('Teacher', 'Principal', 'Super Admin'),
  ctrl.deleteSchedule
);

// ── Mark components ───────────────────────────────────────────────────────────
router.get('/schedules/:examId/components', ctrl.getComponents);
router.put('/schedules/:examId/components', authorize('Teacher', 'Principal', 'Super Admin'), ctrl.saveComponents);

// ── Mark sheet & marks ────────────────────────────────────────────────────────
router.get(
  '/schedules/:examId/marksheet',
  authorize('Teacher', 'Principal', 'Super Admin'),
  ctrl.getMarkSheet
);

router.post(
  '/schedules/:examId/marks/:studentId',
  authorize('Teacher', 'Principal', 'Super Admin'),
  ctrl.saveMarks
);

// ── Report cards ──────────────────────────────────────────────────────────────
router.get('/report-cards', ctrl.listReportCards);
router.get('/report-cards/:id', ctrl.getReportCard);

router.post(
  '/report-cards/generate',
  authorize('Teacher', 'Principal', 'Super Admin'),
  [
    body('student_id').isUUID().withMessage('valid student_id required.'),
    body('term_id').isUUID().withMessage('valid term_id required.'),
  ],
  validate,
  ctrl.generateReportCard
);

router.post(
  '/report-cards/generate-section',
  authorize('Teacher', 'Principal', 'Super Admin'),
  [
    body('class_id').isUUID().withMessage('valid class_id required.'),
    body('section_id').isUUID().withMessage('valid section_id required.'),
    body('term_id').isUUID().withMessage('valid term_id required.'),
  ],
  validate,
  ctrl.generateSectionCards
);

router.patch(
  '/report-cards/:id/publish',
  authorize('Principal', 'Super Admin'),
  [body('is_published').isBoolean().withMessage('is_published boolean required.')],
  validate,
  ctrl.publishReportCard
);

router.patch(
  '/report-cards/:id/remarks/:subId',
  authorize('Teacher', 'Principal', 'Super Admin'),
  [body('remarks').isString().withMessage('remarks string required.')],
  validate,
  ctrl.addRemarks
);

module.exports = router;
