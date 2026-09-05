require('dotenv').config();
const pool = require('../src/db');

async function updateToEthiopianCalendar() {
  try {
    const ayRes = await pool.query(
      `UPDATE academic_years
       SET name = '2018/2019 E.C. (2026/2027)'
       WHERE is_current = TRUE
       RETURNING id, name`
    );
    console.log('✅ Academic Year updated:', ayRes.rows[0]);

    await pool.query(
      `UPDATE terms SET name = 'Term 1 (Meskerem – Tahsas)' WHERE name = 'Term 1' OR name LIKE 'Term 1%'`
    );
    await pool.query(
      `UPDATE terms SET name = 'Term 2 (Tir – Magabit)' WHERE name = 'Term 2' OR name LIKE 'Term 2%'`
    );
    await pool.query(
      `UPDATE terms SET name = 'Term 3 (Miyazya – Sene)' WHERE name = 'Term 3' OR name LIKE 'Term 3%'`
    );

    const termsRes = await pool.query(`SELECT id, name, status FROM terms ORDER BY start_date`);
    console.log('✅ Terms updated:', termsRes.rows);
  } catch (err) {
    console.error('Error updating to Ethiopian calendar:', err.message);
  } finally {
    pool.end();
  }
}

updateToEthiopianCalendar();
