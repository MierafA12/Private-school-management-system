require('dotenv').config();
const pool = require('../src/db');

async function seed() {
  try {
    const fs = await pool.query(
      `INSERT INTO fee_structures (academic_year_id, class_id, fee_type, amount, currency, due_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        '85fa841d-8599-4eec-bda2-87dca744a48c',
        '6ce1c21d-9d44-4dbd-86d4-344a40fc6003',
        'Tuition Fee',
        15000.00,
        'ETB',
        '2026-10-15',
        'Term 1 Tuition Fee'
      ]
    );

    const inv = await pool.query(
      `INSERT INTO fee_invoices (student_id, term_id, fee_structure_id, invoice_number, total_amount, amount_paid, currency, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        'fff94a02-72af-4540-be38-87de36b6d943',
        'c3413d51-8e83-4f11-8d2c-8888fca1db81',
        fs.rows[0].id,
        'INV-2026-00001',
        15000.00,
        0.00,
        'ETB',
        '2026-10-15',
        'UNPAID'
      ]
    );

    console.log('✅ Fee Structure created:', fs.rows[0].id);
    console.log('✅ Fee Invoice created:', inv.rows[0].invoice_number, 'Balance:', inv.rows[0].balance);
  } catch (err) {
    console.error('Error seeding invoice:', err.message);
  } finally {
    pool.end();
  }
}

seed();
