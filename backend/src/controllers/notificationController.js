const svc = require('../services/notificationService');

const ok  = (res, data)     => res.json({ success: true,  data });
const err = (res, msg, s=400) => res.status(s).json({ success: false, message: msg });

// GET /api/notifications
const list = async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const { type } = req.query;
    ok(res, await svc.listNotifications(req.user.id, { limit, offset, type }));
  } catch (e) { next(e); }
};

// GET /api/notifications/unread-count
const unreadCount = async (req, res, next) => {
  try { ok(res, { count: await svc.getUnreadCount(req.user.id) }); }
  catch (e) { next(e); }
};

// PATCH /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    await svc.markRead(req.params.id, req.user.id);
    ok(res, { message: 'Marked as read.' });
  } catch (e) { next(e); }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await svc.markAllRead(req.user.id);
    ok(res, { message: 'All notifications marked as read.' });
  } catch (e) { next(e); }
};

// GET /api/notifications/preferences
const getPreferences = async (req, res, next) => {
  try { ok(res, await svc.getPrefs(req.user.id)); }
  catch (e) { next(e); }
};

// PATCH /api/notifications/preferences
const updatePreferences = async (req, res, next) => {
  try { ok(res, await svc.updatePreferences(req.user.id, req.body)); }
  catch (e) { next(e); }
};

module.exports = { list, unreadCount, markRead, markAllRead, getPreferences, updatePreferences };
