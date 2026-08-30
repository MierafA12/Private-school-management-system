const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// COLLECTIONS REPORT
// ─────────────────────────────────────────────────────────────────────────────
const getCollectionsReport = async ({ dateFrom, dateTo, classId, category } = {}) => {
  const conds  = ['1=1'];
  const params = [];
  let p = 1;

  if (dateFrom) { conds.push(`fp.payment_date >= $${p++}`); params.push(dateFrom); }
  if (dateTo)   { conds.push(`fp.payment_date <= $${p++}`); params.push(dateTo); }
  if (classId)  { conds.push(`e.class_id = $${p++}`);       params.push(classId); }
  if (category) { conds.push(`fs.category = $${p++}`);      params.push(category); }

  const { rows: summary } = await pool.query(
    `SELECT
       COALESCE(SUM(fp.amount), 0)                                         AS total_collected,
       COUNT(DISTINCT fp.id)                                                AS payment_count,
       COUNT(DISTINCT fp.fee_invoice_id)                                    AS invoice_count,
       COALESCE(SUM(fp.amount) FILTER (WHERE fp.payment_method = 'CASH'), 0)          AS cash_total,
       COALESCE(SUM(fp.amount) FILTER (WHERE fp.payment_method = 'BANK_TRANSFER'), 0) AS bank_total,
       COALESCE(SUM(fp.amount) FILTER (WHERE fp.payment_method = 'MOBILE_MONEY'), 0)  AS mobile_total,
       COALESCE(SUM(fp.amount) FILTER (WHERE fp.payment_method = 'GATEWAY'), 0)       AS gateway_total
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students     s  ON s.id  = fi.student_id
     LEFT JOIN fee_structures fs ON fs.id = fi.fee_structure_id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     WHERE ${conds.join(' AND ')}`,
    params
  );

  const { rows: byDay } = await pool.query(
    `SELECT fp.payment_date AS date, SUM(fp.amount) AS total
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students s ON s.id = fi.student_id
     LEFT JOIN fee_structures fs ON fs.id = fi.fee_structure_id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     WHERE ${conds.join(' AND ')}
     GROUP BY fp.payment_date ORDER BY fp.payment_date`,
    params
  );

  const { rows: byMethod } = await pool.query(
    `SELECT fp.payment_method AS method, SUM(fp.amount) AS total, COUNT(*) AS count
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students s ON s.id = fi.student_id
     LEFT JOIN fee_structures fs ON fs.id = fi.fee_structure_id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     WHERE ${conds.join(' AND ')}
     GROUP BY fp.payment_method ORDER BY total DESC`,
    params
  );

  return { summary: summary[0], by_day: byDay, by_method: byMethod };
};

// ─────────────────────────────────────────────────────────────────────────────
// ARREARS REPORT
// ─────────────────────────────────────────────────────────────────────────────
const getArrearsReport = async ({ termId, classId, minBalance } = {}) => {
  const conds  = [`fi.status IN ('UNPAID','PARTIAL','OVERDUE')`, 'fi.balance > 0'];
  const params = [];
  let p = 1;

  if (termId)     { conds.push(`fi.term_id = $${p++}`);  params.push(termId); }
  if (classId)    { conds.push(`e.class_id = $${p++}`);  params.push(classId); }
  if (minBalance) { conds.push(`fi.balance >= $${p++}`); params.push(minBalance); }

  const { rows: summary } = await pool.query(
    `SELECT
       COUNT(*)                    AS invoice_count,
       COALESCE(SUM(fi.balance),0) AS total_outstanding,
       COALESCE(SUM(fi.total_amount),0) AS total_billed,
       COUNT(*) FILTER (WHERE fi.status = 'OVERDUE') AS overdue_count
     FROM fee_invoices fi
     JOIN students s ON s.id = fi.student_id
     LEFT JOIN enrollments e ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     WHERE ${conds.join(' AND ')}`,
    params
  );

  const { rows: students } = await pool.query(
    `SELECT
       (s.first_name || ' ' || s.last_name) AS student_name,
       s.student_number,
       fi.invoice_number,
       fi.total_amount, fi.amount_paid, fi.balance,
       fi.currency, fi.due_date, fi.status,
       t.name  AS term_name,
       c.name  AS class_name, c.grade_level,
       sec.name AS section_name
     FROM fee_invoices fi
     JOIN students s   ON s.id   = fi.student_id
     JOIN terms    t   ON t.id   = fi.term_id
     LEFT JOIN enrollments e   ON e.student_id = s.id AND e.enrollment_status = 'ACTIVE'
     LEFT JOIN classes     c   ON c.id   = e.class_id
     LEFT JOIN sections    sec ON sec.id = e.section_id
     WHERE ${conds.join(' AND ')}
     ORDER BY fi.balance DESC, fi.due_date`,
    params
  );

  return { summary: summary[0], students };
};

// ─────────────────────────────────────────────────────────────────────────────
// REVENUE BY CATEGORY
// ─────────────────────────────────────────────────────────────────────────────
const getRevenueByCategory = async ({ academicYearId, termId } = {}) => {
  const conds  = ['1=1'];
  const params = [];
  let p = 1;

  if (academicYearId) { conds.push(`ay.id = $${p++}`);  params.push(academicYearId); }
  if (termId)         { conds.push(`fi.term_id = $${p++}`); params.push(termId); }

  const { rows: byCategory } = await pool.query(
    `SELECT
       COALESCE(fs.category, 'Uncategorised') AS category,
       COALESCE(SUM(fi.total_amount), 0) AS billed,
       COALESCE(SUM(fi.amount_paid),  0) AS collected,
       COALESCE(SUM(fi.balance),      0) AS outstanding,
       COUNT(fi.id)                       AS invoice_count
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     LEFT JOIN fee_structures fs ON fs.id = fi.fee_structure_id
     WHERE ${conds.join(' AND ')}
     GROUP BY COALESCE(fs.category,'Uncategorised')
     ORDER BY billed DESC`,
    params
  );

  const { rows: overall } = await pool.query(
    `SELECT
       COALESCE(SUM(fi.total_amount), 0) AS total_billed,
       COALESCE(SUM(fi.amount_paid),  0) AS total_collected,
       COALESCE(SUM(fi.balance),      0) AS total_outstanding,
       COUNT(fi.id) AS invoice_count,
       COUNT(fi.id) FILTER (WHERE fi.status = 'PAID') AS paid_count
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE ${conds.join(' AND ')}`,
    params
  );

  return { overall: overall[0], by_category: byCategory };
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardSummary = async () => {
  const { rows: financial } = await pool.query(
    `SELECT
       COALESCE(SUM(fi.total_amount),0) AS total_billed,
       COALESCE(SUM(fi.amount_paid), 0) AS total_collected,
       COALESCE(SUM(fi.balance),     0) AS total_outstanding,
       COUNT(*) FILTER (WHERE fi.status = 'OVERDUE') AS overdue_count,
       COUNT(*) FILTER (WHERE fi.status = 'PAID')    AS paid_count,
       COUNT(*)                                       AS total_invoices
     FROM fee_invoices fi
     JOIN terms t ON t.id = fi.term_id
     JOIN academic_years ay ON ay.id = t.academic_year_id
     WHERE ay.is_current = TRUE`
  );

  const { rows: recentPayments } = await pool.query(
    `SELECT fp.id, fp.amount, fp.payment_date, fp.payment_method,
       fp.receipt_number, fi.invoice_number, fi.currency,
       (s.first_name || ' ' || s.last_name) AS student_name
     FROM fee_payments fp
     JOIN fee_invoices fi ON fi.id = fp.fee_invoice_id
     JOIN students s ON s.id = fi.student_id
     ORDER BY fp.created_at DESC LIMIT 10`
  );

  const { rows: monthlyTrend } = await pool.query(
    `SELECT TO_CHAR(fp.payment_date,'Mon YYYY') AS month,
       EXTRACT(MONTH FROM fp.payment_date) AS month_num,
       EXTRACT(YEAR  FROM fp.payment_date) AS year_num,
       SUM(fp.amount) AS total
     FROM fee_payments fp
     WHERE fp.payment_date >= NOW() - INTERVAL '6 months'
     GROUP BY TO_CHAR(fp.payment_date,'Mon YYYY'),
              EXTRACT(MONTH FROM fp.payment_date),
              EXTRACT(YEAR  FROM fp.payment_date)
     ORDER BY year_num, month_num`
  );

  return {
    financial: financial[0],
    recent_payments: recentPayments,
    monthly_trend: monthlyTrend,
  };
};

module.exports = {
  getCollectionsReport,
  getArrearsReport,
  getRevenueByCategory,
  getDashboardSummary,
};
