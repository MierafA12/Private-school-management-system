const svc = require('../services/notificationService');

// Wrap every handler so a missing-table error returns a safe empty response
// instead of a 500 that breaks the UI.
const safe = (fn, fallback) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    if (
      err.code === '42P01' || // relation does not exist
      err.message?.includes('does not exist')
    ) {
      return res.json({ success: true, data: fallback });
    }
    next(err);
  }
};

const ok = (res, data) => res.json({ success: true, data });

// GET /api/notifications
const list = safe(async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
  const offset = parseInt(req.query.offset) || 0;
  const { type } = req.query;
  ok(res, await svc.listNotifications(req.user.id, { limit, offset, type }));
}, { notifications: [], total: 0 });

// GET /api/notifications/unread-count
const unreadCount = safe(async (req, res) => {
  ok(res, { count: await svc.getUnreadCount(req.user.id) });
}, { count: 0 });

// PATCH /api/notifications/:id/read
const markRead = safe(async (req, res) => {
  await svc.markRead(req.params.id, req.user.id);
  ok(res, { message: 'Marked as read.' });
}, { message: 'ok' });

// PATCH /api/notifications/read-all
const markAllRead = safe(async (req, res) => {
  await svc.markAllRead(req.user.id);
  ok(res, { message: 'All notifications marked as read.' });
}, { message: 'ok' });

// GET /api/notifications/preferences
const getPreferences = safe(async (req, res) => {
  ok(res, await svc.getPrefs(req.user.id));
}, {});

// PATCH /api/notifications/preferences
const updatePreferences = safe(async (req, res) => {
  ok(res, await svc.updatePreferences(req.user.id, req.body));
}, {});

module.exports = { list, unreadCount, markRead, markAllRead, getPreferences, updatePreferences };
