const express = require('express');
const { body, query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const principalService = require('../services/principalService');

const router = express.Router();

// All principal routes require authentication and Principal/Admin role
router.use(authenticate);
router.use(authorize('Principal', 'Super Admin'));

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await principalService.getDashboardAnalytics();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// ─── ANNOUNCEMENTS ───────────────────────────────────────────────────────────

router.get(
  '/announcements',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { limit, offset } = req.query;
      const data = await principalService.getAnnouncements({ limit, offset });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/announcements',
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('body').notEmpty().withMessage('Body is required'),
    body('audience').optional().isIn(['ALL', 'PARENTS', 'STUDENTS', 'TEACHERS', 'CLASS']),
    body('priority').optional().isIn(['NORMAL', 'HIGH', 'URGENT']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const data = await principalService.createAnnouncement(req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.delete('/announcements/:id', async (req, res, next) => {
  try {
    await principalService.deleteAnnouncement(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
