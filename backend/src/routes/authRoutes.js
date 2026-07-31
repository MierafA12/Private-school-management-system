const router  = require('express').Router();
const { body } = require('express-validator');

const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const validate        = require('../middleware/validate');

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/login
// Body: { email?, phone?, password }
// ═════════════════════════════════════════════════════════════════════════════
router.post(
  '/login',
  [
    body()
      .custom((_, { req }) => {
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
  async (req, res, next) => {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
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
  async (req, res, next) => {
    try {
      const result = await authService.refresh(req.body.refresh_token);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
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
  async (req, res, next) => {
    try {
      await authService.changePassword(
        req.user.id,
        req.body.current_password,
        req.body.new_password
      );
      res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      next(err);
    }
  }
);

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/auth/logout   (client-side — invalidate refresh token if stored)
// For stateless JWT we just tell the client to discard tokens.
// If you add a token blacklist table later, revoke here.
// ═════════════════════════════════════════════════════════════════════════════
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Logged out. Please discard your tokens.' });
});

module.exports = router;
