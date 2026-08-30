const pool         = require('../db');
// notificationService imported lazily to avoid circular deps at startup
const getNotifSvc = () => require('./notificationService');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const generateInvoiceNumber = async (client) => {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM fee_invoices
     WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
  );
  const seq = String(parseInt(rows[0].cnt) + 1).padStart(5, '0');
  return `INV-${year}-${seq}`;
};

const generateReceiptNumber = async (client) => {
  const year = new Date().getFullYear();
  const { rows } = await client.query(
    `SELECT COUNT(*) AS cnt FROM fee_payments
     WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
  );
  const seq = String(parseInt(rows[0].cnt) + 1).padStart(5, '0');
  return `RCP-${year}-${seq}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// FEE STRUCTURES  (accountant-side)
// ─────────────────────────────────────────────────────────────────────────────

const getFeeStructures = async ({ academicYearId, termId, classId, status } = {}) => {
  const conds  = ['fs.status != $1'];
  const params = ['ARCHIVED'];
  let p = 2;
  if (academicYearId) { conds.push(`fs.academic_year_id = $${p++}`); params.push(academicYearId); }
  if (termId)         { conds.push(`fs.term_id = $${p++}`);          params.push(termId); }
  if (classId)        { conds.push(`fs.class_id = $${p++}`);         params.push(classId); }
  if (status)         { conds.push(`fs.status = $${p++}`);           params.push(status); }

  const { rows } = await pool.query(
    `SELECT fs.*,
       ay.name  AS academic_year_name,
       t.name   AS term_name,
       c.name   AS class_name,
       c.grade_level
     FROM fee_structures fs
     JOIN academic_years ay ON ay.id = fs.academic_year_id
     LEFT JOIN terms   t ON t.id  = fs.term_id
     LEFT JOIN classes c ON c.id  = fs.class_id
     WHERE ${conds.join(' AND ')}
     ORDER BY c.grade_level, fs.category, fs.created_at DESC`,
    params
  );
  return rows;
};

const getFeeStructureById = async (id) => {
  const { rows } = await pool.query(
    `SELECT fs.*,
       ay.name AS academic_year_name,
       t.name  AS term_name,
       c.name  AS class_name
     FROM fee_structures fs
     JOIN academic_years ay ON ay.id = fs.academic_year_id
     LEFT JOIN terms   t ON t.id = fs.term_id
     LEFT JOIN classes c ON c.id = fs.class_id
     WHERE fs.id = $1`, [id]
  );
  return rows[0] || null;
};

const createFeeStructure = async (fields, createdBy) => {
  const { rows } = await pool.query(
    `INSERT INTO fee_structures
       (academic_year_id, term_id, class_id, category, description,
        amount, currency, is_mandatory, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ACTIVE',$9)
     RETURNING *`,
    [
      fields.academic_year_id, fields.term_id || null,
      fields.class_id || null, fields.category,
      fields.description || null, fields.amount,
      fields.currency || 'KES', fields.is_mandatory !== false,
      createdBy,
    ]
  );
  return rows[0];
};

const updateFeeStructure = async (id, fields) => {
  const allowed = ['category','description','amount','currency','is_mandatory','status'];
  const sets    = [];
  const params  = [];
  let p = 1;
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = $${p++}`);
      params.push(fields[key]);
    }
  }
  if (!sets.length) return getFeeStructureById(id);
  sets.push(`updated_at = NOW()`);
  params.push(id);
  const { rows } = await pool.query(
    `UPDATE fee_structures SET ${sets.join(', ')} WHERE id = $${p} RETURNING *`,
    params
  );
  return rows[0] || null;
};

const archiveFeeStructure = async (id) => {
  const { rows } = await pool.query(
    `UPDATE fee_structures
     SET status = 'ARCHIVED', archived_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`, [id]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK INVOICE GENERATION  (accountant-side)
// ─────────────────────────────────────────────────────────────────────────────

const generateInvoices = async ({ termId, classId, feeStructureId, dueDate, createdBy }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get fee structure
    const { rows: fs } = await client.query(
      `SELECT * FROM fee_structures WHERE id = $1 AND status = 'ACTIVE'`, [feeStructureId]
    );
    if (!fs.length) {
      const err = new Error('Fee structure not found or inactive.'); err.status = 404; throw err;
    }
    const structure = fs[0];

    // Get enrolled students for this class/term
    const { rows: students } = await client.query(
      `SELECT s.id AS student_id
       FROM enrollments e
       JOIN students s ON s.id = e.student_id
       WHERE e.class_id = $1
         AND e.academic_year_id = (SELECT academic_year_id FROM terms WHERE id = $2)
         AND e.enrollment_status = 'ACTIVE'`,
      [classId, termId]
    );
    if (!students.length) {
      await client.query('ROLLBACK');
      return { generated: 0, skipped: 0, message: 'No active enrollments found for this class/term.' };
    }

    let generated = 0;
    let skipped   = 0;

    for (const { student_id } of students) {
      // Skip if invoice already exists for this student/term/structure
      const { rows: existing } = await client.query(
        `SELECT id FROM fee_invoices
         WHERE student_id = $1 AND term_id = $2 AND fee_structure_id = $3`,
        [student_id, termId, feeStructureId]
      );
      if (existing.length) { skipped++; continue; }

      const invoiceNumber = await generateInvoiceNumber(client);

      await client.query(
        `INSERT INTO fee_invoices
           (invoice_number, student_id, term_id, fee_structure_id,
            total_amount, currency, due_date, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'UNPAID',$8)`,
        [
          invoiceNumber, student_id, termId, feeStructureId,
          structure.amount, structure.currency,
          dueDate || null, createdBy,
        ]
      );
      generated++;
    }

    await client.query('COMMIT');
    return { generated, skipped, total: students.length };
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES — accountant full-access (no student scope restriction)
// ─────────────────────────────────────────────────────────────────────────────

const getAllInvoices = async ({ termId, classId, status, search, limit = 30, offset = 0 } = {}) => {
  const conds  = ['1=1'];
  const params = [];
  let p = 1;

  if (termId)  { conds.push(`fi.term_id = $${p++}`);   params.push(termId); }
  if (classId) { conds.push(`e.class_id = $${p++}`);   params.push(classId); }
  if (status)  { conds.push(`fi.status = $${p++}`);    params.push(status); }
  if (search)  {
    conds.push(`(LOWER(s.first_name || ' ' || s.last_name) LIKE $${p} OR fi.invoice_number LIKE $${p})`);
    params.push(`%${search.toLowerCase()}%`); p++;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT fi.id, fi.invoice_number, fi.total_amount, fi.amount_paid,
       fi.balance, fi.currency, fi.due_date, fi.status, fi.created_at,
       t.name  AS term_name,
       ay.name AS academic_year,
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number,
       c.name AS class_name, c.grade_level,
       sec.name AS section_name
     FROM fee_invoices fi
     JOIN terms        t   ON t.id   = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students     s   ON s.id   = fi.student_id
     LEFT JOIN enrollments e   ON e.student_id = s.id AND e.academic_year_id = ay.id AND e.enrollment_status = 'ACTIVE'
     LEFT JOIN classes     c   ON c.id   = e.class_id
     LEFT JOIN sections    sec ON sec.id = e.section_id
     WHERE ${conds.join(' AND ')}
     ORDER BY fi.created_at DESC
     LIMIT $${p++} OFFSET $${p++}`,
    params
  );

  const countParams = params.slice(0, -2);
  const { rows: ct } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students s ON s.id = fi.student_id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.academic_year_id = ay.id AND e.enrollment_status = 'ACTIVE'
     WHERE ${conds.join(' AND ')}`,
    countParams
  );

  return { invoices: rows, total: parseInt(ct[0].total), limit, offset };
};

const getInvoiceByIdAdmin = async (invoiceId) => {
  const { rows: inv } = await pool.query(
    `SELECT fi.*,
       t.name  AS term_name,
       ay.name AS academic_year,
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number,
       fs.category AS fee_category
     FROM fee_invoices fi
     JOIN terms        t  ON t.id  = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students     s  ON s.id  = fi.student_id
     LEFT JOIN fee_structures fs ON fs.id = fi.fee_structure_id
     WHERE fi.id = $1`,
    [invoiceId]
  );
  if (!inv.length) return null;

  const { rows: payments } = await pool.query(
    `SELECT fp.*, u.email AS recorded_by_email
     FROM fee_payments fp
     LEFT JOIN users u ON u.id = fp.recorded_by
     WHERE fp.fee_invoice_id = $1
     ORDER BY fp.payment_date DESC`,
    [invoiceId]
  );

  const { rows: installments } = await pool.query(
    `SELECT * FROM fee_installment_plans WHERE fee_invoice_id = $1 ORDER BY installment_no`,
    [invoiceId]
  );

  return { ...inv[0], payments, installments };
};

// ─────────────────────────────────────────────────────────────────────────────
// MANUAL PAYMENT RECORDING  (accountant-side, no scope restriction)
// ─────────────────────────────────────────────────────────────────────────────

const recordManualPayment = async (invoiceId, {
  amount, method, paymentDate, transactionRef, notes, recordedBy
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate invoice exists and is payable
    const { rows: inv } = await client.query(
      `SELECT * FROM fee_invoices WHERE id = $1`, [invoiceId]
    );
    if (!inv.length) {
      const err = new Error('Invoice not found.'); err.status = 404; throw err;
    }
    if (['WAIVED','CANCELLED'].includes(inv[0].status)) {
      const err = new Error(`Invoice is ${inv[0].status.toLowerCase()} and cannot accept payments.`);
      err.status = 400; throw err;
    }
    if (parseFloat(amount) > parseFloat(inv[0].balance)) {
      const err = new Error('Payment amount exceeds outstanding balance.'); err.status = 400; throw err;
    }

    const receiptNumber = await generateReceiptNumber(client);

    const { rows: payment } = await client.query(
      `INSERT INTO fee_payments
         (fee_invoice_id, amount, payment_date, payment_method,
          transaction_reference, receipt_number, notes, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        invoiceId, amount,
        paymentDate || new Date().toISOString().split('T')[0],
        method, transactionRef || null, receiptNumber,
        notes || null, recordedBy,
      ]
    );

    // Update invoice amounts + status in one query
    await client.query(
      `UPDATE fee_invoices
       SET amount_paid = amount_paid + $1,
           status = CASE
             WHEN amount_paid + $1 >= total_amount THEN 'PAID'
             WHEN amount_paid + $1 > 0             THEN 'PARTIAL'
             ELSE status
           END,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, invoiceId]
    );

    await client.query('COMMIT');

    // Fire payment confirmation notification (non-blocking)
    try {
      const { rows: inv } = await pool.query(
        `SELECT fi.student_id, fi.invoice_number,
           (s.first_name || ' ' || s.last_name) AS student_name
         FROM fee_invoices fi JOIN students s ON s.id = fi.student_id
         WHERE fi.id = $1`, [invoiceId]
      );
      if (inv.length) {
        // Notify student
        getNotifSvc().dispatch(
          /* we need student user_id */ null,
          'payment_confirmation',
          { title: 'Payment Received', body: `Payment of ${method} ${amount} recorded for invoice ${inv[0].invoice_number}. Receipt: ${receiptNumber}`, link: '/student/fees', refType: 'fee_invoice', refId: invoiceId }
        ).catch(() => {});
        // Get parent user ids and notify them too
        pool.query(
          `SELECT pu.id FROM users pu JOIN parents p ON p.user_id = pu.id
           JOIN student_parents sp ON sp.parent_id = p.id
           WHERE sp.student_id = $1 AND pu.status = 'ACTIVE'`,
          [inv[0].student_id]
        ).then(({ rows: parents }) => {
          for (const { id } of parents) {
            getNotifSvc().dispatch(id, 'payment_confirmation', {
              title: 'Payment Confirmation',
              body:  `Payment received for ${inv[0].student_name}. Receipt: ${receiptNumber}. Amount: ${amount}.`,
              link:  '/parent/fees',
              refType: 'fee_invoice',
              refId: invoiceId,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch (_) {}

    return { ...payment[0], receipt_number: receiptNumber };
  } catch (err) {
    await client.query('ROLLBACK'); throw err;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS LIST  (accountant-side)
// ─────────────────────────────────────────────────────────────────────────────

const getAllPayments = async ({ method, dateFrom, dateTo, search, limit = 30, offset = 0 } = {}) => {
  const conds  = ['1=1'];
  const params = [];
  let p = 1;

  if (method)   { conds.push(`fp.payment_method = $${p++}`); params.push(method); }
  if (dateFrom) { conds.push(`fp.payment_date >= $${p++}`);  params.push(dateFrom); }
  if (dateTo)   { conds.push(`fp.payment_date <= $${p++}`);  params.push(dateTo); }
  if (search)   {
    conds.push(`(fp.receipt_number ILIKE $${p} OR fp.transaction_reference ILIKE $${p} OR LOWER(s.first_name || ' ' || s.last_name) LIKE $${p})`);
    params.push(`%${search}%`); p++;
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_method,
       fp.transaction_reference, fp.receipt_number, fp.notes, fp.created_at,
       fi.invoice_number, fi.currency,
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number,
       u.email AS recorded_by_email
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students     s  ON s.id  = fi.student_id
     LEFT JOIN users   u  ON u.id  = fp.recorded_by
     WHERE ${conds.join(' AND ')}
     ORDER BY fp.payment_date DESC, fp.created_at DESC
     LIMIT $${p++} OFFSET $${p++}`,
    params
  );

  const countParams = params.slice(0, -2);
  const { rows: ct } = await pool.query(
    `SELECT COUNT(*) AS total
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students     s  ON s.id  = fi.student_id
     WHERE ${conds.join(' AND ')}`,
    countParams
  );

  return { payments: rows, total: parseInt(ct[0].total), limit, offset };
};

const getPaymentReceipt = async (paymentId) => {
  const { rows } = await pool.query(
    `SELECT fp.*,
       fi.invoice_number, fi.currency, fi.total_amount,
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number,
       t.name  AS term_name,
       ay.name AS academic_year,
       u.email AS recorded_by_email
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students s ON s.id = fi.student_id
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     LEFT JOIN users u ON u.id = fp.recorded_by
     WHERE fp.id = $1`,
    [paymentId]
  );
  return rows[0] || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// PARENT-PORTAL METHODS (unchanged — kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

const getInvoicesByStudentIds = async (studentIds) => {
  if (!studentIds.length) return [];
  const { rows } = await pool.query(
    `SELECT fi.id, fi.invoice_number, fi.total_amount,
       fi.amount_paid, fi.balance, fi.currency,
       fi.due_date, fi.status, fi.notes, fi.created_at,
       t.name  AS term_name,
       ay.name AS academic_year,
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number
     FROM fee_invoices fi
     JOIN terms        t  ON t.id  = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students     s  ON s.id  = fi.student_id
     WHERE fi.student_id = ANY($1::uuid[])
     ORDER BY fi.created_at DESC`,
    [studentIds]
  );
  return rows;
};

const getInvoiceById = async (invoiceId, studentIds) => {
  const { rows: inv } = await pool.query(
    `SELECT fi.*, t.name AS term_name, ay.name AS academic_year,
       (s.first_name || ' ' || s.last_name) AS student_name
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     JOIN students s ON s.id = fi.student_id
     WHERE fi.id = $1 AND fi.student_id = ANY($2::uuid[])`,
    [invoiceId, studentIds]
  );
  if (!inv.length) return null;
  const { rows: payments } = await pool.query(
    `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_method,
       fp.transaction_reference, fp.receipt_number, fp.notes, fp.created_at
     FROM fee_payments fp WHERE fp.fee_invoice_id = $1 ORDER BY fp.payment_date DESC`,
    [invoiceId]
  );
  return { ...inv[0], payments };
};

const initiatePayment = async (invoiceId, studentIds, { amount, method = 'GATEWAY' }) => {
  const invoice = await getInvoiceById(invoiceId, studentIds);
  if (!invoice) { const err = new Error('Invoice not found or access denied.'); err.status = 404; throw err; }
  if (['PAID','WAIVED','CANCELLED'].includes(invoice.status)) {
    const err = new Error(`Invoice is already ${invoice.status.toLowerCase()}.`); err.status = 400; throw err;
  }
  if (amount > invoice.balance) {
    const err = new Error('Payment amount exceeds outstanding balance.'); err.status = 400; throw err;
  }
  const gatewaySession = {
    session_id:   `mock_${Date.now()}`,
    redirect_url: `https://checkout.stripe.com/mock?invoice=${invoiceId}`,
    amount, currency: invoice.currency,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  return { invoice_number: invoice.invoice_number, gateway: gatewaySession };
};

const recordPayment = async (invoiceId, { amount, method, transactionRef, receiptNumber, notes, recordedBy }) => {
  return recordManualPayment(invoiceId, {
    amount, method, transactionRef, notes, recordedBy,
    paymentDate: new Date().toISOString().split('T')[0],
  });
};

module.exports = {
  // fee structures
  getFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
  // invoices — admin
  generateInvoices,
  getAllInvoices,
  getInvoiceByIdAdmin,
  // payments — admin
  recordManualPayment,
  getAllPayments,
  getPaymentReceipt,
  // parent-portal compat
  getInvoicesByStudentIds,
  getInvoiceById,
  initiatePayment,
  recordPayment,
};
