require('dotenv').config();
const pool = require('../src/db');

async function run() {
  console.log('Running report_cards schema patch...');
  await pool.query(`
    ALTER TABLE report_cards
    ADD COLUMN IF NOT EXISTS enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL;
  `);
  await pool.query(`
    ALTER TABLE report_cards
    ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
  `);
  await pool.query(`
    ALTER TABLE report_cards
    ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES users(id) ON DELETE SET NULL;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_report_cards_enrollment_id ON report_cards(enrollment_id);
  `);
  console.log('Done! Verified columns:');
  const cols = await pool.query(`
    SELECT column_name, data_type FROM information_schema.columns
    WHERE table_name = 'report_cards' ORDER BY ordinal_position
  `);
  console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
