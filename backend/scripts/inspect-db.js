require('dotenv').config();
const pool = require('../src/db');

async function main() {
  const { rows } = await pool.query('SELECT id, user_id, employee_number FROM teachers LIMIT 1');
  console.log('Sample teacher:', rows[0]);
  pool.end();
}

main();
