const router   = require('express').Router();
const ctrl     = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require a valid JWT — no role restriction (scoped to req.user.id)
router.use(authenticate);

router.get('/',                    ctrl.list);
router.get('/unread-count',        ctrl.unreadCount);
router.get('/preferences',         ctrl.getPreferences);
router.patch('/read-all',          ctrl.markAllRead);
router.patch('/preferences',       ctrl.updatePreferences);
router.patch('/:id/read',          ctrl.markRead);

module.exports = router;
