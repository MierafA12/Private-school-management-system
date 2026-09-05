require('dotenv').config();
const pool = require('../src/db');

async function updateToTwoSemesters() {
  try {
    const ayId = '85fa841d-8599-4eec-bda2-87dca744a48c';
    await pool.query("DELETE FROM terms WHERE id = '02849abf-8c3b-4ec3-bbc4-c9f9feed40a0'");
    await pool.query(`
      UPDATE terms
      SET name = 'Semester 1 (Term 1: Meskerem – Tir)',
          start_date = '2026-09-01',
          end_date = '2027-01-31',
          status = 'ACTIVE'
      WHERE id = 'c3413d51-8e83-4f11-8d2c-8888fca1db81'
    `);
    await pool.query(`
      UPDATE terms
      SET name = 'Semester 2 (Term 2: Yakatit – Sene)',
          start_date = '2027-02-01',
          end_date = '2027-06-30',
          status = 'INACTIVE'
      WHERE id = 'b3423090-9fbf-4197-9bf7-62d7b861d9db'
    `);

    const { rows } = await pool.query('SELECT id, name, start_date, end_date, status FROM terms ORDER BY start_date');
    console.log('✅ Updated to 2 terms:', rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    pool.end();
  }
}

updateToTwoSemesters();
