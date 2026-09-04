const router = require('express').Router();
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// Body: { email?, phone?, password }
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/login',
  [
    body().custom((_, { req }) => {
      if (!req.body.email && !req.body.phone) {
        throw new Error('Email or phone is required.');
      }
      return true;
    }),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email address.'),
    body('phone')
      .optional()
      .isMobilePhone()
      .withMessage('Invalid phone number.'),
    body('password')
      .notEmpty()
      .withMessage('Password is required.')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters.'),
  ],
  validate,
  authController.login
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/refresh
// Body: { refresh_token }
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/refresh',
  [
    body('refresh_token')
      .notEmpty()
      .withMessage('refresh_token is required.'),
  ],
  validate,
  authController.refresh
);

// ═════════════════════════════════════════════════════════════════════════════
// GET /api/auth/me  — return full profile for any logged-in user
// ═════════════════════════════════════════════════════════════════════════════
router.get('/me', authenticate, authController.getMe);

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/profile — update editable fields for any logged-in user
// Fields: first_name, last_name, phone, profile_photo, address, gender
// ═════════════════════════════════════════════════════════════════════════════
router.patch(
  '/profile',
  authenticate,
  [
    body('first_name').optional().isString().trim().notEmpty(),
    body('last_name').optional().isString().trim().notEmpty(),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
    body('profile_photo').optional().isURL().withMessage('profile_photo must be a URL.'),
  ],
  validate,
  authController.updateProfile
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/change-password   (requires valid JWT)
// Body: { current_password, new_password }
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/change-password',
  authenticate,
  [
    body('current_password')
      .notEmpty()
      .withMessage('current_password is required.'),
    body('new_password')
      .isLength({ min: 8 })
      .withMessage('new_password must be at least 8 characters.')
      .matches(/[A-Z]/)
      .withMessage('new_password must contain at least one uppercase letter.')
      .matches(/[0-9]/)
      .withMessage('new_password must contain at least one number.'),
  ],
  validate,
  authController.changePassword
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout   (client-side — invalidate refresh token if stored)
// ═════════════════════════════════════════════════════════════════════════════
router.post('/logout', authenticate, authController.logout);

module.exports = router;
