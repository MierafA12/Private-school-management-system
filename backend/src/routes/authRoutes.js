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
// GET /api/auth/me  — return full profile for any logged-in user
// ═════════════════════════════════════════════════════════════════════════════
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await require('../db').query(
      `SELECT
         u.id, u.email, u.phone, u.status, u.last_login, u.created_at,
         r.name AS role,
         COALESCE(s.first_name, t.first_name, par.first_name, stf.first_name) AS first_name,
         COALESCE(s.last_name,  t.last_name,  par.last_name,  stf.last_name)  AS last_name,
         COALESCE(s.profile_photo, t.profile_photo, par.profile_photo, stf.profile_photo) AS profile_photo,
         COALESCE(s.gender, t.gender, par.gender, stf.gender) AS gender,
         s.student_number, s.admission_number,
         t.employee_number AS teacher_employee_number, t.qualification, t.specialization,
         stf.employee_number AS staff_employee_number, stf.department
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN students s   ON s.user_id  = u.id
       LEFT JOIN teachers t   ON t.user_id  = u.id
       LEFT JOIN parents  par ON par.user_id = u.id
       LEFT JOIN staff    stf ON stf.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = rows[0];
    user.full_name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

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
  async (req, res, next) => {
    try {
      const pool = require('../db');
      const { first_name, last_name, phone, profile_photo, address, gender } = req.body;
      const userId = req.user.id;

      // Update phone on users table
      if (phone !== undefined) {
        await pool.query(
          `UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2`,
          [phone, userId]
        );
      }

      // Update profile table based on role
      const { rows: roleRows } = await pool.query(
        `SELECT r.name AS role FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [userId]
      );
      const role = roleRows[0]?.role;

      if (role === 'Student') {
        await pool.query(
          `UPDATE students
           SET first_name    = COALESCE($1, first_name),
               last_name     = COALESCE($2, last_name),
               profile_photo = COALESCE($3, profile_photo),
               address       = COALESCE($4, address),
               gender        = COALESCE($5, gender),
               updated_at    = NOW()
           WHERE user_id = $6`,
          [first_name, last_name, profile_photo, address, gender, userId]
        );
      } else if (role === 'Teacher') {
        await pool.query(
          `UPDATE teachers
           SET first_name    = COALESCE($1, first_name),
               last_name     = COALESCE($2, last_name),
               profile_photo = COALESCE($3, profile_photo),
               address       = COALESCE($4, address),
               gender        = COALESCE($5, gender),
               updated_at    = NOW()
           WHERE user_id = $6`,
          [first_name, last_name, profile_photo, address, gender, userId]
        );
      } else if (role === 'Parent') {
        await pool.query(
          `UPDATE parents
           SET first_name    = COALESCE($1, first_name),
               last_name     = COALESCE($2, last_name),
               profile_photo = COALESCE($3, profile_photo),
               address       = COALESCE($4, address),
               gender        = COALESCE($5, gender),
               updated_at    = NOW()
           WHERE user_id = $6`,
          [first_name, last_name, profile_photo, address, gender, userId]
        );
      } else {
        // Staff (Principal, Registrar, Accountant, Super Admin)
        await pool.query(
          `UPDATE staff
           SET first_name    = COALESCE($1, first_name),
               last_name     = COALESCE($2, last_name),
               profile_photo = COALESCE($3, profile_photo),
               address       = COALESCE($4, address),
               gender        = COALESCE($5, gender),
               updated_at    = NOW()
           WHERE user_id = $6`,
          [first_name, last_name, profile_photo, address, gender, userId]
        );
      }

      res.json({ success: true, message: 'Profile updated successfully.' });
    } catch (err) { next(err); }
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
