const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');

const SALT_ROUNDS    = 12;
const ACCESS_EXPIRY  = '15m';
const REFRESH_EXPIRY = '7d';

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

const signAccess = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });

const signRefresh = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

const login = async ({ email, phone, password }) => {
  // Find user by email or phone
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.phone, u.password_hash, u.status,
            u.failed_login_attempts, r.name AS role_name
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE ($1::text IS NOT NULL AND LOWER(u.email) = LOWER($1))
        OR ($2::text IS NOT NULL AND u.phone = $2)
     LIMIT 1`,
    [email || null, phone || null]
  );

  if (!rows.length) {
    const err = new Error('Invalid credentials.'); err.status = 401; throw err;
  }

  const user = rows[0];

  // Locked?
  if (user.status === 'LOCKED') {
    const err = new Error('Account is locked. Please contact the administrator.');
    err.status = 403; throw err;
  }
  if (user.status !== 'ACTIVE') {
    const err = new Error(`Account is ${user.status.toLowerCase()}.`);
    err.status = 403; throw err;
  }

  // Check password
  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    const attempts = user.failed_login_attempts + 1;
    const newStatus = attempts >= 5 ? 'LOCKED' : 'ACTIVE';

    await pool.query(
      `UPDATE users
       SET failed_login_attempts = $1, status = $2, updated_at = NOW()
       WHERE id = $3`,
      [attempts, newStatus, user.id]
    );

    if (newStatus === 'LOCKED') {
      const err = new Error('Account locked after 5 failed attempts.');
      err.status = 403; throw err;
    }

    const err = new Error(`Invalid credentials. ${5 - attempts} attempt(s) remaining.`);
    err.status = 401; throw err;
  }

  // Reset failed attempts + update last_login
  await pool.query(
    `UPDATE users
     SET failed_login_attempts = 0,
         last_login            = NOW(),
         updated_at            = NOW()
     WHERE id = $1`,
    [user.id]
  );

  // Get profile name based on role
  let profileName = null;
  if (user.role_name === 'Student') {
    const { rows: sr } = await pool.query(
      `SELECT first_name, last_name FROM students WHERE user_id = $1`, [user.id]
    );
    if (sr.length) profileName = `${sr[0].first_name} ${sr[0].last_name}`;
  } else if (['Teacher'].includes(user.role_name)) {
    const { rows: tr } = await pool.query(
      `SELECT first_name, last_name FROM teachers WHERE user_id = $1`, [user.id]
    );
    if (tr.length) profileName = `${tr[0].first_name} ${tr[0].last_name}`;
  } else {
    const { rows: stf } = await pool.query(
      `SELECT first_name, last_name FROM staff WHERE user_id = $1`, [user.id]
    );
    if (stf.length) profileName = `${stf[0].first_name} ${stf[0].last_name}`;
  }

  const accessToken  = signAccess(user.id);
  const refreshToken = signRefresh(user.id);

  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    token_type:    'Bearer',
    expires_in:    ACCESS_EXPIRY,
    user: {
      id:        user.id,
      email:     user.email,
      phone:     user.phone,
      role:      user.role_name,
      full_name: profileName,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────

const refresh = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token.'); err.status = 401; throw err;
  }

  // Confirm user is still active
  const { rows } = await pool.query(
    `SELECT id, status FROM users WHERE id = $1`, [decoded.userId]
  );
  if (!rows.length || rows[0].status !== 'ACTIVE') {
    const err = new Error('User not found or inactive.'); err.status = 401; throw err;
  }

  return {
    access_token: signAccess(decoded.userId),
    token_type:   'Bearer',
    expires_in:   ACCESS_EXPIRY,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────

const changePassword = async (userId, currentPassword, newPassword) => {
  const { rows } = await pool.query(
    `SELECT password_hash FROM users WHERE id = $1`, [userId]
  );
  if (!rows.length) {
    const err = new Error('User not found.'); err.status = 404; throw err;
  }

  const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!match) {
    const err = new Error('Current password is incorrect.'); err.status = 401; throw err;
  }

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.query(
    `UPDATE users
     SET password_hash        = $1,
         password_changed_at  = NOW(),
         updated_at           = NOW()
     WHERE id = $2`,
    [hash, userId]
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HASH  (utility used when creating users)
// ─────────────────────────────────────────────────────────────────────────────

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

module.exports = { login, refresh, changePassword, hashPassword };
