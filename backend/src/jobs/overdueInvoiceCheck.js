/**
 * overdueInvoiceCheck.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scans fee_invoices for UNPAID/PARTIAL records past their due_date,
 * marks them OVERDUE, and dispatches fee_reminder notifications to the
 * parent(s) linked to each student.
 *
 * Called by index.js on a schedule (node-cron).
 * Safe to call manually: node src/jobs/overdueInvoiceCheck.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const pool                = require('../db');
const notificationService = require('../services/notificationService');

const run = async () => {
  console.log('[overdueInvoiceCheck] Starting…');

  try {
    // 1. Mark overdue
    const { rows: marked } = await pool.query(
      `UPDATE fee_invoices
       SET status = 'OVERDUE', updated_at = NOW()
       WHERE status IN ('UNPAID','PARTIAL')
         AND due_date IS NOT NULL
         AND due_date < CURRENT_DATE
       RETURNING id, student_id, balance, currency, invoice_number`
    );

    if (!marked.length) {
      console.log('[overdueInvoiceCheck] No new overdue invoices.');
      return;
    }

    console.log(`[overdueInvoiceCheck] Marked ${marked.length} invoice(s) as OVERDUE.`);

    // 2. Notify parents for each overdue invoice
    for (const inv of marked) {
      // Find parent user IDs linked to this student
      const { rows: parents } = await pool.query(
        `SELECT pu.id AS user_id
         FROM student_parents sp
         JOIN parents p  ON p.id  = sp.parent_id
         JOIN users   pu ON pu.id = p.user_id
         WHERE sp.student_id = $1 AND pu.status = 'ACTIVE'`,
        [inv.student_id]
      );

      for (const { user_id } of parents) {
        await notificationService.dispatch(user_id, 'fee_reminder', {
          title:   'Fee Payment Overdue',
          body:    `Invoice ${inv.invoice_number} has an outstanding balance of ${inv.currency} ${parseFloat(inv.balance).toLocaleString()}. Please make payment as soon as possible to avoid penalties.`,
          link:    '/parent/fees',
          refType: 'fee_invoice',
          refId:   inv.id,
        }).catch(err => console.error(`[overdueInvoiceCheck] dispatch failed for ${user_id}:`, err.message));
      }
    }

    console.log('[overdueInvoiceCheck] Done.');
  } catch (err) {
    console.error('[overdueInvoiceCheck] Error:', err.message);
  }
};

module.exports = { run };

// Allow direct execution: node src/jobs/overdueInvoiceCheck.js
if (require.main === module) {
  require('dotenv').config();
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}
