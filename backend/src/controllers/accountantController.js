const feeSvc    = require('../services/feeService');
const reportSvc = require('../services/reportService');
const gatewaySvc = require('../services/paymentGatewayService');

// ─── helpers ─────────────────────────────────────────────────────────────────
const ok  = (res, data, status = 200) => res.status(status).json({ success: true,  data });
const err = (res, msg, status = 400)  => res.status(status).json({ success: false, message: msg });

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
const getDashboard = async (req, res, next) => {
  try { ok(res, await reportSvc.getDashboardSummary()); }
  catch (e) { next(e); }
};

// ═════════════════════════════════════════════════════════════════════════════
// FEE STRUCTURES
// ═════════════════════════════════════════════════════════════════════════════
const getFeeStructures = async (req, res, next) => {
  try {
    const { academic_year_id, term_id, class_id, status } = req.query;
    ok(res, await feeSvc.getFeeStructures({ academicYearId: academic_year_id, termId: term_id, classId: class_id, status }));
  } catch (e) { next(e); }
};

const createFeeStructure = async (req, res, next) => {
  try { ok(res, await feeSvc.createFeeStructure(req.body, req.user.id), 201); }
  catch (e) { next(e); }
};

const updateFeeStructure = async (req, res, next) => {
  try {
    const updated = await feeSvc.updateFeeStructure(req.params.id, req.body);
    if (!updated) return err(res, 'Fee structure not found.', 404);
    ok(res, updated);
  } catch (e) { next(e); }
};

const archiveFeeStructure = async (req, res, next) => {
  try {
    const archived = await feeSvc.archiveFeeStructure(req.params.id);
    if (!archived) return err(res, 'Fee structure not found.', 404);
    ok(res, { message: 'Fee structure archived.' });
  } catch (e) { next(e); }
};

// ═════════════════════════════════════════════════════════════════════════════
// INVOICES
// ═════════════════════════════════════════════════════════════════════════════
const generateInvoices = async (req, res, next) => {
  try {
    const { term_id, class_id, fee_structure_id, due_date } = req.body;
    if (!term_id || !class_id || !fee_structure_id) {
      return err(res, 'term_id, class_id, and fee_structure_id are required.');
    }
    const result = await feeSvc.generateInvoices({
      termId: term_id, classId: class_id,
      feeStructureId: fee_structure_id, dueDate: due_date,
      createdBy: req.user.id,
    });
    ok(res, result, 201);
  } catch (e) { next(e); }
};

const getInvoices = async (req, res, next) => {
  try {
    const { term_id, class_id, status, search, limit, offset } = req.query;
    ok(res, await feeSvc.getAllInvoices({
      termId: term_id, classId: class_id, status, search,
      limit:  Math.min(parseInt(limit)  || 30, 100),
      offset: parseInt(offset) || 0,
    }));
  } catch (e) { next(e); }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await feeSvc.getInvoiceByIdAdmin(req.params.id);
    if (!invoice) return err(res, 'Invoice not found.', 404);
    ok(res, invoice);
  } catch (e) { next(e); }
};

// ═════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ═════════════════════════════════════════════════════════════════════════════
const recordPayment = async (req, res, next) => {
  try {
    const { invoice_id, amount, method, payment_date, transaction_ref, notes } = req.body;
    if (!invoice_id || !amount || !method) {
      return err(res, 'invoice_id, amount, and method are required.');
    }
    const payment = await feeSvc.recordManualPayment(invoice_id, {
      amount, method, paymentDate: payment_date,
      transactionRef: transaction_ref, notes, recordedBy: req.user.id,
    });
    ok(res, payment, 201);
  } catch (e) { next(e); }
};

const getPayments = async (req, res, next) => {
  try {
    const { method, date_from, date_to, search, limit, offset } = req.query;
    ok(res, await feeSvc.getAllPayments({
      method, dateFrom: date_from, dateTo: date_to, search,
      limit:  Math.min(parseInt(limit)  || 30, 100),
      offset: parseInt(offset) || 0,
    }));
  } catch (e) { next(e); }
};

const getReceipt = async (req, res, next) => {
  try {
    const receipt = await feeSvc.getPaymentReceipt(req.params.paymentId);
    if (!receipt) return err(res, 'Payment not found.', 404);
    ok(res, receipt);
  } catch (e) { next(e); }
};

// ═════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═════════════════════════════════════════════════════════════════════════════
const collectionsReport = async (req, res, next) => {
  try {
    const { date_from, date_to, class_id, category } = req.query;
    ok(res, await reportSvc.getCollectionsReport({ dateFrom: date_from, dateTo: date_to, classId: class_id, category }));
  } catch (e) { next(e); }
};

const arrearsReport = async (req, res, next) => {
  try {
    const { term_id, class_id, min_balance } = req.query;
    ok(res, await reportSvc.getArrearsReport({ termId: term_id, classId: class_id, minBalance: min_balance }));
  } catch (e) { next(e); }
};

const revenueReport = async (req, res, next) => {
  try {
    const { academic_year_id, term_id } = req.query;
    ok(res, await reportSvc.getRevenueByCategory({ academicYearId: academic_year_id, termId: term_id }));
  } catch (e) { next(e); }
};

// ═════════════════════════════════════════════════════════════════════════════
// POST /api/accountant/webhooks/payment-gateway  (PUBLIC — no JWT)
// Chapa posts here after a transaction completes.
// ═════════════════════════════════════════════════════════════════════════════
const chapaWebhook = async (req, res, next) => {
  try {
    // req.body is a raw Buffer (express.raw middleware)
    const rawBody  = req.body;
    const sig      = req.headers['x-chapa-signature'] || req.headers['chapa-signature'] || '';

    // 1. Verify signature — reject if invalid
    const valid = gatewaySvc.verifyWebhookSignature(rawBody, sig);
    if (!valid) {
      console.warn('[chapaWebhook] Invalid signature — rejected');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
    }

    // 2. Parse body
    let payload;
    try {
      const bodyStr = Buffer.isBuffer(rawBody)
        ? rawBody.toString()
        : typeof rawBody === 'string'
          ? rawBody
          : JSON.stringify(rawBody);
      payload = JSON.parse(bodyStr);
    } catch (_) {
      return res.status(400).json({ success: false, message: 'Invalid JSON payload.' });
    }

    const { tx_ref, status } = payload;
    if (!tx_ref) {
      return res.status(400).json({ success: false, message: 'Missing tx_ref in webhook payload.' });
    }

    // 3. Always respond 200 immediately so Chapa doesn't retry
    res.status(200).json({ success: true, received: true });

    // 4. Process asynchronously after responding
    if (status === 'success') {
      gatewaySvc.processSuccessfulPayment(tx_ref, payload)
        .then(r => console.log(`[chapaWebhook] Processed tx_ref=${tx_ref}`, r))
        .catch(e => console.error(`[chapaWebhook] Processing failed tx_ref=${tx_ref}:`, e.message));
    } else {
      // Mark gateway_status as FAILED or CANCELLED
      const pool = require('../db');
      pool.query(
        `UPDATE fee_invoices SET gateway_status = $1, updated_at = NOW() WHERE tx_ref = $2`,
        [status === 'cancelled' ? 'CANCELLED' : 'FAILED', tx_ref]
      ).catch(() => {});
    }
  } catch (e) { next(e); }
};

module.exports = {
  getDashboard, getFeeStructures, createFeeStructure,
  updateFeeStructure, archiveFeeStructure,
  generateInvoices, getInvoices, getInvoice,
  recordPayment, getPayments, getReceipt,
  collectionsReport, arrearsReport, revenueReport,
  chapaWebhook,
};
