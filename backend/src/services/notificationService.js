/**
 * notificationService.js
 * Central notification dispatch — in-app write + email/SMS fan-out.
 * Rule: in-app row is ALWAYS written. External delivery failure never
 *       blocks the operation — it is logged to notification_delivery_log.
 */

const pool         = require('../db');
const emailProvider = require('./emailProvider');
const smsProvider   = require('./smsProvider');

// ─── Notification type → preference column ────────────────────────────────────
const PREF_KEY = {
  fee_reminder:          'fee_alerts',
  payment_confirmation:  'fee_alerts',
  attendance_alert:      'attendance_alerts',
  results_published:     'results_alerts',
  report_card_published: 'results_alerts',
  announcement:          'announcement_alerts',
  new_message:           'new_message_alerts',
  system:                null, // always deliver
  general:               null,
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: get or auto-create user notification preferences
// ─────────────────────────────────────────────────────────────────────────────
const getPrefs = async (userId) => {
  let { rows } = await pool.query(
    `SELECT * FROM notification_preferences WHERE user_id = $1`, [userId]
  );
  if (!rows.length) {
    const ins = await pool.query(
      `INSERT INTO notification_preferences (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING RETURNING *`, [userId]
    );
    if (ins.rows.length) return ins.rows[0];
    // Race condition — re-fetch
    ({ rows } = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`, [userId]
    ));
  }
  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: log delivery attempt
// ─────────────────────────────────────────────────────────────────────────────
const logDelivery = async (notificationId, userId, channel, status, providerResponse, errorMessage) => {
  try {
    await pool.query(
      `INSERT INTO notification_delivery_log
         (notification_id, user_id, channel, status, provider_response, error_message)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [notificationId, userId, channel, status,
       providerResponse ? JSON.stringify(providerResponse) : null,
       errorMessage || null]
    );
  } catch (_) { /* log failure must never throw */ }
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: write in-app notification row
// ─────────────────────────────────────────────────────────────────────────────
const writeInApp = async (userId, type, title, body, link, refType, refId) => {
  const { rows } = await pool.query(
    `INSERT INTO notifications
       (user_id, type, title, body, link, ref_type, ref_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id`,
    [userId, type, title, body, link || null, refType || null, refId || null]
  );
  return rows[0].id;
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: get user email + phone for external delivery
// ─────────────────────────────────────────────────────────────────────────────
const getUserContact = async (userId) => {
  const { rows } = await pool.query(
    `SELECT email, phone FROM users WHERE id = $1`, [userId]
  );
  return rows[0] || {};
};

// ─────────────────────────────────────────────────────────────────────────────
// dispatch()  — primary public API
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} userId  Target user UUID
 * @param {string} type    One of the notification type values
 * @param {object} payload { title, body, link?, refType?, refId? }
 */
const dispatch = async (userId, type, { title, body, link, refType, refId } = {}) => {
  // 1. Always write in-app notification
  let notifId = null;
  try {
    notifId = await writeInApp(userId, type, title, body, link, refType, refId);
    await logDelivery(notifId, userId, 'in_app', 'SENT', null, null);
  } catch (err) {
    console.error('[notificationService] in-app write failed:', err.message);
    return; // nothing else to do without a row
  }

  // 2. Check preferences
  const prefs   = await getPrefs(userId);
  const prefKey = PREF_KEY[type];
  const typeEnabled = prefKey ? prefs[prefKey] !== false : true;

  if (!typeEnabled) {
    await logDelivery(notifId, userId, 'email', 'SKIPPED', null, 'User opted out of this notification type');
    return;
  }

  const contact = await getUserContact(userId);

  // 3. Email
  if (prefs.email_enabled && contact.email) {
    try {
      const result = await emailProvider.sendEmail({
        to:      contact.email,
        subject: title,
        text:    body,
      });
      await logDelivery(notifId, userId, 'email', 'SENT', result, null);
    } catch (err) {
      await logDelivery(notifId, userId, 'email', 'FAILED', null, err.message);
    }
  }

  // 4. SMS
  if (prefs.sms_enabled && contact.phone) {
    try {
      const result = await smsProvider.sendSms({ to: contact.phone, body: `${title}: ${body}` });
      await logDelivery(notifId, userId, 'sms', 'SENT', result, null);
    } catch (err) {
      await logDelivery(notifId, userId, 'sms', 'FAILED', null, err.message);
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// dispatchToAudience()  — for announcements targeting role/grade/section
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {object} filter  { audience, classId? }
 *   audience: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS' | 'STAFF' | 'CLASS'
 * @param {string} type
 * @param {object} payload
 */
const dispatchToAudience = async (filter, type, payload) => {
  const { audience, classId } = filter;
  let userIds = [];

  try {
    if (audience === 'ALL') {
      const { rows } = await pool.query(`SELECT id FROM users WHERE status = 'ACTIVE'`);
      userIds = rows.map(r => r.id);
    } else if (audience === 'STUDENTS') {
      const { rows } = await pool.query(
        `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'Student' AND u.status = 'ACTIVE'`
      );
      userIds = rows.map(r => r.id);
    } else if (audience === 'PARENTS') {
      const { rows } = await pool.query(
        `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'Parent' AND u.status = 'ACTIVE'`
      );
      userIds = rows.map(r => r.id);
    } else if (audience === 'TEACHERS') {
      const { rows } = await pool.query(
        `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.name = 'Teacher' AND u.status = 'ACTIVE'`
      );
      userIds = rows.map(r => r.id);
    } else if (audience === 'CLASS' && classId) {
      // Students enrolled in this class + their parents
      const { rows: students } = await pool.query(
        `SELECT u.id FROM users u
         JOIN students s ON s.user_id = u.id
         JOIN enrollments e ON e.student_id = s.id
         WHERE e.class_id = $1 AND e.enrollment_status = 'ACTIVE' AND u.status = 'ACTIVE'`,
        [classId]
      );
      const { rows: parents } = await pool.query(
        `SELECT DISTINCT pu.id FROM users pu
         JOIN parents p ON p.user_id = pu.id
         JOIN student_parents sp ON sp.parent_id = p.id
         JOIN students s ON s.id = sp.student_id
         JOIN enrollments e ON e.student_id = s.id
         WHERE e.class_id = $1 AND e.enrollment_status = 'ACTIVE' AND pu.status = 'ACTIVE'`,
        [classId]
      );
      userIds = [...students, ...parents].map(r => r.id);
    }

    // Fan out — fire and don't await each individually to avoid timeout
    await Promise.allSettled(userIds.map(uid => dispatch(uid, type, payload)));
  } catch (err) {
    console.error('[notificationService] dispatchToAudience failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER-FACING QUERIES  (used by notificationController)
// ─────────────────────────────────────────────────────────────────────────────

const listNotifications = async (userId, { limit = 20, offset = 0, type } = {}) => {
  const conds = [`n.user_id = $1`, `n.archived = FALSE`];
  const params = [userId];
  let p = 2;
  if (type) { conds.push(`n.type = $${p++}`); params.push(type); }
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT n.id, n.type, n.title, n.body, n.link,
       n.ref_type, n.ref_id, n.is_read, n.read_at, n.created_at
     FROM notifications n
     WHERE ${conds.join(' AND ')}
     ORDER BY n.created_at DESC
     LIMIT $${p++} OFFSET $${p++}`,
    params
  );

  const { rows: ct } = await pool.query(
    `SELECT COUNT(*) AS total FROM notifications n
     WHERE ${conds.slice(0, -0).join(' AND ')}`,
    params.slice(0, -2)
  );

  return { notifications: rows, total: parseInt(ct[0].total) };
};

const getUnreadCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) AS count FROM notifications
     WHERE user_id = $1 AND is_read = FALSE AND archived = FALSE`,
    [userId]
  );
  return parseInt(rows[0].count);
};

const markRead = async (notifId, userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [notifId, userId]
  );
};

const markAllRead = async (userId) => {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE, read_at = NOW()
     WHERE user_id = $1 AND is_read = FALSE`,
    [userId]
  );
};

const updatePreferences = async (userId, prefs) => {
  const allowed = [
    'email_enabled','sms_enabled','push_enabled',
    'fee_alerts','attendance_alerts','grade_alerts',
    'announcement_alerts','new_message_alerts','results_alerts',
  ];
  const sets   = [];
  const params = [];
  let p = 1;
  for (const key of allowed) {
    if (prefs[key] !== undefined) { sets.push(`${key} = $${p++}`); params.push(prefs[key]); }
  }
  if (!sets.length) return getPrefs(userId);
  sets.push('updated_at = NOW()');
  params.push(userId);

  const { rows } = await pool.query(
    `INSERT INTO notification_preferences (user_id) VALUES ($${p})
     ON CONFLICT (user_id) DO UPDATE SET ${sets.join(', ')}
     RETURNING *`,
    [...params.slice(0, -1), userId]
  );
  return rows[0];
};

module.exports = {
  dispatch,
  dispatchToAudience,
  listNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  getPrefs,
  updatePreferences,
};
