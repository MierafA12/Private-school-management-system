const router = require('express').Router();
const { body, query, param } = require('express-validator');
const ctrl     = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// ── Chapa Webhook — PUBLIC (no JWT, secured by HMAC signature) ────────────────
router.post(
  '/webhooks/payment-gateway',
  require('express').raw({ type: 'application/json' }),
  ctrl.chapaWebhook
);

// All other routes require JWT + Accountant or Super Admin
router.use(authenticate);
router.use(authorize('Accountant', 'Super Admin'));

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Fee Structures ────────────────────────────────────────────────────────────
router.get('/fee-structures', ctrl.getFeeStructures);

router.post('/fee-structures', [
  body('academic_year_id').isUUID(),
  body('category').isString().trim().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('term_id').optional().isUUID(),
  body('class_id').optional().isUUID(),
  body('currency').optional().isString().isLength({ max: 10 }),
  body('is_mandatory').optional().isBoolean(),
], validate, ctrl.createFeeStructure);

router.patch('/fee-structures/:id', [
  param('id').isUUID(),
  body('amount').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['ACTIVE','INACTIVE','ARCHIVED']),
], validate, ctrl.updateFeeStructure);

router.delete('/fee-structures/:id', [param('id').isUUID()], validate, ctrl.archiveFeeStructure);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.post('/invoices/generate', [
  body('term_id').isUUID(),
  body('class_id').isUUID(),
  body('fee_structure_id').isUUID(),
  body('due_date').optional().isISO8601(),
], validate, ctrl.generateInvoices);

router.get('/invoices', ctrl.getInvoices);
router.get('/invoices/:id', [param('id').isUUID()], validate, ctrl.getInvoice);

// ── Payments ──────────────────────────────────────────────────────────────────
router.post('/payments', [
  body('invoice_id').isUUID(),
  body('amount').isFloat({ min: 0.01 }),
  body('method').isIn(['CASH','BANK_TRANSFER','MOBILE_MONEY','CARD','CHEQUE','GATEWAY','WAIVER']),
  body('payment_date').optional().isISO8601(),
  body('transaction_ref').optional().isString(),
  body('notes').optional().isString(),
], validate, ctrl.recordPayment);

router.get('/payments', ctrl.getPayments);
router.get('/payments/:paymentId/receipt', [param('paymentId').isUUID()], validate, ctrl.getReceipt);

// ── Reports ───────────────────────────────────────────────────────────────────
router.get('/reports/collections', ctrl.collectionsReport);
router.get('/reports/arrears',     ctrl.arrearsReport);
router.get('/reports/revenue',     ctrl.revenueReport);

module.exports = router;
