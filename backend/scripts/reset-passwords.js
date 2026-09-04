require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const hash = await bcrypt.hash('Admin@1234', 12);
  const emails = [
    'admin@school.com',
    'principal@school.com',
    'registrar@school.com',
    'accountant@school.com',
    'teacher@school.com',
    'student@school.com',
    'parent@school.com'
  ];

  console.log('\n🔐 Resetting passwords for all default accounts...\n');

  for (const email of emails) {
    const res = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING email',
      [hash, email]
    );
    console.log(`  ✓ ${email} -> Admin@1234 (${res.rowCount > 0 ? 'Updated' : 'Not found'})`);
  }

  await pool.end();
  console.log('\n✅ All passwords set to: Admin@1234\n');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
