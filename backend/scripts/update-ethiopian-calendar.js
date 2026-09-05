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
      `UPDATE terms SET name = 'Semester 1 (Meskerem – Tir)' WHERE name ILIKE '%Semester 1%' OR name ILIKE '%Term 1%'`
    );
    await pool.query(
      `UPDATE terms SET name = 'Semester 2 (Yakatit – Sene)' WHERE name ILIKE '%Semester 2%' OR name ILIKE '%Term 2%'`
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
