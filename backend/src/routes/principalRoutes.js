const router = require('express').Router();
const { body, query } = require('express-validator');

const ctrl     = require('../controllers/principalController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const ALLOWED = ['Principal', 'Super Admin'];

router.use(authenticate);
router.use(authorize(...ALLOWED));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Academic Years ─────────────────────────────────────────────────────────────
router.get('/academic-years',     ctrl.getAcademicYears);
router.get('/academic-years/:id', ctrl.getAcademicYearById);

router.post(
  '/academic-years',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('start_date').isDate().withMessage('start_date must be a valid date.'),
    body('end_date').isDate().withMessage('end_date must be a valid date.'),
    body('is_current').optional().isBoolean(),
  ],
  validate, ctrl.createAcademicYear
);

router.patch(
  '/academic-years/:id',
  [
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('is_current').optional().isBoolean(),
    body('status').optional().isIn(['ACTIVE','INACTIVE']),
  ],
  validate, ctrl.updateAcademicYear
);

// ── Terms ──────────────────────────────────────────────────────────────────────
router.post(
  '/academic-years/:yearId/terms',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('start_date').isDate().withMessage('start_date must be a valid date.'),
    body('end_date').isDate().withMessage('end_date must be a valid date.'),
    body('status').optional().isIn(['ACTIVE','INACTIVE','COMPLETED']),
  ],
  validate, ctrl.createTerm
);

router.patch(
  '/terms/:id',
  [
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('status').optional().isIn(['ACTIVE','INACTIVE','COMPLETED']),
  ],
  validate, ctrl.updateTerm
);

router.delete('/terms/:id', ctrl.deleteTerm);

// ── Classes ────────────────────────────────────────────────────────────────────
router.get('/classes',     ctrl.getClasses);
router.get('/classes/:id', ctrl.getClassById);

router.post(
  '/classes',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('grade_level').isInt({ min: 0, max: 20 }).withMessage('grade_level must be a number 0–20.'),
  ],
  validate, ctrl.createClass
);

router.patch('/classes/:id',
  [body('grade_level').optional().isInt({ min: 0, max: 20 })],
  validate, ctrl.updateClass
);

router.delete('/classes/:id', ctrl.deleteClass);

// ── Sections ───────────────────────────────────────────────────────────────────
router.post(
  '/classes/:classId/sections',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('capacity').optional().isInt({ min: 1 }),
  ],
  validate, ctrl.createSection
);

router.patch('/sections/:id',
  [body('capacity').optional().isInt({ min: 1 })],
  validate, ctrl.updateSection
);

router.delete('/sections/:id', ctrl.deleteSection);

// ── Subjects ───────────────────────────────────────────────────────────────────
router.get('/subjects', ctrl.getSubjects);

router.post(
  '/subjects',
  [
    body('code').notEmpty().withMessage('code is required.'),
    body('name').notEmpty().withMessage('name is required.'),
  ],
  validate, ctrl.createSubject
);

router.patch('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);

// ── Curriculum ─────────────────────────────────────────────────────────────────
router.get(
  '/curriculum',
  [
    query('academic_year_id').isUUID().withMessage('academic_year_id required.'),
    query('class_id').isUUID().withMessage('class_id required.'),
  ],
  validate, ctrl.getCurriculum
);

router.post(
  '/curriculum',
  [
    body('academic_year_id').isUUID(),
    body('class_id').isUUID(),
    body('subject_id').isUUID(),
    body('weekly_periods').optional().isInt({ min: 1, max: 20 }),
    body('pass_mark').optional().isFloat({ min: 0, max: 100 }),
    body('max_mark').optional().isFloat({ min: 1 }),
  ],
  validate, ctrl.assignSubject
);

router.delete('/curriculum/:id', ctrl.removeSubject);

module.exports = router;
