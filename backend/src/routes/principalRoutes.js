const router = require('express').Router();
const { body, query } = require('express-validator');

const ctrl = require('../controllers/principalController');
const svc  = require('../services/principalService');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

const ALLOWED = ['Principal', 'Super Admin'];

router.use(authenticate);
router.use(authorize(...ALLOWED));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── School Profile ────────────────────────────────────────────────────────────
router.get('/school-profile', ctrl.getSchoolProfile);
router.patch('/school-profile', ctrl.updateSchoolProfile);

// ── Teachers list (for dropdowns in assignments) ──────────────────────────────
router.get('/teachers', ctrl.getTeacherList);

// ── Academic Years ─────────────────────────────────────────────────────────────
router.get('/academic-years',     ctrl.getAcademicYears);
router.get('/academic-years/:id', ctrl.getAcademicYearById);
router.post('/academic-years',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('start_date').isDate().withMessage('start_date must be a valid date.'),
    body('end_date').isDate().withMessage('end_date must be a valid date.'),
    body('is_current').optional().isBoolean(),
  ],
  validate, ctrl.createAcademicYear
);
router.patch('/academic-years/:id',
  [
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('is_current').optional().isBoolean(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE']),
  ],
  validate, ctrl.updateAcademicYear
);

// ── Terms ──────────────────────────────────────────────────────────────────────
router.post('/academic-years/:yearId/terms',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('start_date').isDate().withMessage('start_date must be a valid date.'),
    body('end_date').isDate().withMessage('end_date must be a valid date.'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'COMPLETED']),
  ],
  validate, ctrl.createTerm
);
router.patch('/terms/:id',
  [
    body('start_date').optional().isDate(),
    body('end_date').optional().isDate(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'COMPLETED']),
  ],
  validate, ctrl.updateTerm
);
router.delete('/terms/:id', ctrl.deleteTerm);

// ── Classes ────────────────────────────────────────────────────────────────────
router.get('/classes',     ctrl.getClasses);
router.get('/classes/:id', ctrl.getClassById);
router.post('/classes',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('grade_level').isInt({ min: 0, max: 20 }).withMessage('grade_level must be 0–20.'),
  ],
  validate, ctrl.createClass
);
router.patch('/classes/:id',
  [body('grade_level').optional().isInt({ min: 0, max: 20 })],
  validate, ctrl.updateClass
);
router.delete('/classes/:id', ctrl.deleteClass);

// ── Sections ───────────────────────────────────────────────────────────────────
router.post('/classes/:classId/sections',
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
router.post('/subjects',
  [
    body('code').notEmpty().withMessage('code is required.'),
    body('name').notEmpty().withMessage('name is required.'),
  ],
  validate, ctrl.createSubject
);
router.patch('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);

// ── Curriculum subjects ────────────────────────────────────────────────────────
router.get('/curriculum',
  [
    query('academic_year_id').isUUID().withMessage('academic_year_id required.'),
    query('class_id').isUUID().withMessage('class_id required.'),
  ],
  validate, ctrl.getCurriculum
);
router.post('/curriculum',
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

// ── Grading Scales ────────────────────────────────────────────────────────────
router.get('/grading-scales', ctrl.getGradingScales);
router.post('/grading-scales',
  [
    body('name').notEmpty().withMessage('name is required.'),
    body('min_percentage').isFloat({ min: 0, max: 100 }).withMessage('min_percentage 0–100.'),
    body('max_percentage').isFloat({ min: 0, max: 100 }).withMessage('max_percentage 0–100.'),
    body('is_pass').optional().isBoolean(),
    body('sort_order').optional().isInt({ min: 0 }),
  ],
  validate, ctrl.createGradingScale
);
router.patch('/grading-scales/:id',
  [
    body('min_percentage').optional().isFloat({ min: 0, max: 100 }),
    body('max_percentage').optional().isFloat({ min: 0, max: 100 }),
    body('is_pass').optional().isBoolean(),
    body('sort_order').optional().isInt({ min: 0 }),
  ],
  validate, ctrl.updateGradingScale
);
router.delete('/grading-scales/:id', ctrl.deleteGradingScale);

// ── Class Advisors ────────────────────────────────────────────────────────────
router.get('/class-advisors',
  [query('academic_year_id').isUUID().withMessage('academic_year_id required.')],
  validate, ctrl.getClassAdvisors
);
router.post('/class-advisors',
  [
    body('academic_year_id').isUUID(),
    body('class_id').isUUID(),
    body('section_id').isUUID(),
    body('teacher_id').isUUID(),
    body('assigned_date').isDate().withMessage('assigned_date is required.'),
  ],
  validate, ctrl.assignClassAdvisor
);
router.delete('/class-advisors/:id', ctrl.removeClassAdvisor);

// ── Timetable ─────────────────────────────────────────────────────────────────
router.get('/timetable', ctrl.getTimetable);

router.post('/timetable',
  [
    body('academic_year_id').isUUID(),
    body('term_id').isUUID(),
    body('class_id').isUUID(),
    body('section_id').isUUID(),
    body('curriculum_subject_id').isUUID(),
    body('teacher_id').isUUID(),
    body('day_of_week').isIn(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']),
    body('period_number').isInt({ min: 1, max: 12 }),
    body('start_time').matches(/^\d{2}:\d{2}$/).withMessage('start_time must be HH:MM.'),
    body('end_time').matches(/^\d{2}:\d{2}$/).withMessage('end_time must be HH:MM.'),
  ],
  validate, ctrl.createTimetableSlot
);
router.patch('/timetable/:id', ctrl.updateTimetableSlot);
router.delete('/timetable/:id', ctrl.deleteTimetableSlot);

router.post('/timetable/clear',
  [
    body('term_id').isUUID(),
    body('section_id').isUUID(),
  ],
  validate, ctrl.clearTimetable
);

// ── Fee Structures ────────────────────────────────────────────────────────────
router.get('/fee-structures', ctrl.getFeeStructures);
router.post('/fee-structures',
  [
    body('academic_year_id').isUUID(),
    body('fee_type').notEmpty().withMessage('fee_type is required.'),
    body('amount').isFloat({ min: 0 }).withMessage('amount must be a positive number.'),
  ],
  validate, ctrl.createFeeStructure
);
router.patch('/fee-structures/:id',
  [body('amount').optional().isFloat({ min: 0 })],
  validate, ctrl.updateFeeStructure
);
router.delete('/fee-structures/:id', ctrl.deleteFeeStructure);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try { res.json({ success: true, data: await svc.getAnnouncements(req.query) }); }
    catch (err) { next(err); }
  }
);
router.post('/announcements',
  [
    body('title').notEmpty().withMessage('Title is required.'),
    body('body').notEmpty().withMessage('Body is required.'),
    body('audience').optional().isIn(['ALL','PARENTS','STUDENTS','TEACHERS','CLASS']),
    body('priority').optional().isIn(['LOW','NORMAL','HIGH','URGENT']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const data = await svc.createAnnouncement(req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }
);
router.delete('/announcements/:id', async (req, res, next) => {
  try { await svc.deleteAnnouncement(req.params.id); res.json({ success: true, message: 'Deleted.' }); }
  catch (err) { next(err); }
});

module.exports = router;
