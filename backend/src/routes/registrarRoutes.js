const router = require('express').Router();
const { body, query } = require('express-validator');

const ctrl     = require('../controllers/registrarController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// All registrar routes: must be logged in + have an admin-level role
router.use(authenticate);
router.use(authorize('Registrar', 'Principal', 'Super Admin'));

// ── Shared password rule ──────────────────────────────────────────────────────
const pwdRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters.');

const emailOrPhone = body()
  .custom((_, { req }) => {
    if (!req.body.email && !req.body.phone) throw new Error('email or phone is required.');
    return true;
  });

// ── Register student ──────────────────────────────────────────────────────────
router.post(
  '/students',
  [
    emailOrPhone,
    pwdRule,
    body('first_name').notEmpty().withMessage('first_name is required.'),
    body('last_name').notEmpty().withMessage('last_name is required.'),
    body('gender').isIn(['Male','Female','Other']).withMessage('gender must be Male, Female, or Other.'),
    body('date_of_birth').isDate().withMessage('date_of_birth must be a valid date.'),
    body('address').notEmpty().withMessage('address is required.'),
    body('emergency_contact_name').notEmpty().withMessage('emergency_contact_name is required.'),
    body('emergency_contact_phone').notEmpty().withMessage('emergency_contact_phone is required.'),
    body('admission_date').isDate().withMessage('admission_date must be a valid date.'),
  ],
  validate,
  ctrl.createStudent
);

// ── Register parent ───────────────────────────────────────────────────────────
router.post(
  '/parents',
  [
    emailOrPhone,
    pwdRule,
    body('first_name').notEmpty().withMessage('first_name is required.'),
    body('last_name').notEmpty().withMessage('last_name is required.'),
    body('relationship').notEmpty().withMessage('relationship is required.'),
    body('address').notEmpty().withMessage('address is required.'),
  ],
  validate,
  ctrl.createParent
);

// ── Register teacher ──────────────────────────────────────────────────────────
router.post(
  '/teachers',
  [
    emailOrPhone,
    pwdRule,
    body('first_name').notEmpty().withMessage('first_name is required.'),
    body('last_name').notEmpty().withMessage('last_name is required.'),
    body('gender').isIn(['Male','Female','Other']).withMessage('gender must be Male, Female, or Other.'),
    body('qualification').notEmpty().withMessage('qualification is required.'),
    body('hire_date').isDate().withMessage('hire_date must be a valid date.'),
  ],
  validate,
  ctrl.createTeacher
);

// ── Register staff (Registrar / Accountant / Principal etc.) ──────────────────
router.post(
  '/staff',
  [
    emailOrPhone,
    pwdRule,
    body('first_name').notEmpty().withMessage('first_name is required.'),
    body('last_name').notEmpty().withMessage('last_name is required.'),
    body('gender').isIn(['Male','Female','Other']).withMessage('gender must be Male, Female, or Other.'),
    body('role_name')
      .isIn(['Registrar','Accountant','Principal','Super Admin'])
      .withMessage('role_name must be Registrar, Accountant, Principal, or Super Admin.'),
    body('hire_date').isDate().withMessage('hire_date must be a valid date.'),
  ],
  validate,
  ctrl.createStaff
);

// ── User management ───────────────────────────────────────────────────────────
router.get(
  '/users',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.getUsers
);

router.get('/users/:id', ctrl.getUser);

router.post(
  '/users/:id/reset-password',
  [body('new_password').isLength({ min: 6 }).withMessage('Minimum 6 characters.')],
  validate,
  ctrl.resetPassword
);

router.patch(
  '/users/:id/status',
  [body('status').isIn(['ACTIVE','INACTIVE','SUSPENDED','LOCKED']).withMessage('Invalid status.')],
  validate,
  ctrl.updateStatus
);

module.exports = router;
