/**
 * seed-admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates the first Super Admin + Registrar accounts so the system can be
 * bootstrapped from scratch.
 *
 * Usage:
 *   node scripts/seed-admin.js
 *
 * Reads DATABASE_URL and credentials from .env
 * Safe to run multiple times — skips if the email already exists.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Pool }  = require('pg');
const bcrypt    = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Accounts to seed ──────────────────────────────────────────────────────────
// Change these before running in production, or set env vars to override.
const SEED_ACCOUNTS = [
  {
    role:       'Super Admin',
    email:      process.env.SEED_ADMIN_EMAIL    || 'admin@school.com',
    password:   process.env.SEED_ADMIN_PASSWORD || 'Admin@1234',
    first_name: 'Super',
    last_name:  'Admin',
    gender:     'Male',
    hire_date:  new Date().toISOString().split('T')[0],
  },
  {
    role:       'Registrar',
    email:      process.env.SEED_REGISTRAR_EMAIL    || 'registrar@school.com',
    password:   process.env.SEED_REGISTRAR_PASSWORD || 'Reg@1234',
    first_name: 'School',
    last_name:  'Registrar',
    gender:     'Female',
    hire_date:  new Date().toISOString().split('T')[0],
  },
];

const SALT = 12;

async function seed() {
  const client = await pool.connect();
  try {
    console.log('\n🌱  Seeding admin accounts…\n');

    for (const acct of SEED_ACCOUNTS) {
      // Check if email already exists
      const { rows: existing } = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1)`,
        [acct.email]
      );
      if (existing.length) {
        console.log(`  ⚠️  ${acct.role} (${acct.email}) — already exists, skipped.`);
        continue;
      }

      // Get role id
      const { rows: roleRows } = await client.query(
        `SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1`,
        [acct.role]
      );
      if (!roleRows.length) {
        console.error(`  ✗  Role "${acct.role}" not found — have you run migrations?`);
        continue;
      }
      const roleId = roleRows[0].id;

      // Hash password
      const hash = await bcrypt.hash(acct.password, SALT);

      await client.query('BEGIN');

      // Insert user
      const { rows: userRows } = await client.query(
        `INSERT INTO users (role_id, email, password_hash, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         RETURNING id`,
        [roleId, acct.email.toLowerCase(), hash]
      );
      const userId = userRows[0].id;

      // Generate employee number
      const { rows: cntRows } = await client.query(
        `SELECT COUNT(*) AS cnt FROM staff`
      );
      const empNum = `STF-${String(parseInt(cntRows[0].cnt) + 1).padStart(4, '0')}`;

      // Insert staff profile
      await client.query(
        `INSERT INTO staff
           (user_id, employee_number, first_name, last_name, gender,
            hire_date, employment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')`,
        [userId, empNum, acct.first_name, acct.last_name, acct.gender, acct.hire_date]
      );

      await client.query('COMMIT');

      console.log(`  ✓  ${acct.role} created`);
      console.log(`       Email:    ${acct.email}`);
      console.log(`       Password: ${acct.password}`);
      console.log(`       Emp#:     ${empNum}\n`);
    }

    console.log('✅  Seeding complete.\n');
    console.log('   Log in at: http://localhost:5000  (backend running)');
    console.log('   Frontend:  http://localhost:5173/login\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n✗  Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
