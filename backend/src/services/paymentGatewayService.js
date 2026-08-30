/**
 * paymentGatewayService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Chapa payment gateway adapter.
 * Docs: https://developer.chapa.co/docs
 *
 * Required env vars (backend/.env):
 *   CHAPA_SECRET_KEY   — from dashboard.chapa.co → Settings → API Keys
 *   CHAPA_WEBHOOK_SECRET — set in dashboard under Webhooks
 *   CHAPA_BASE_URL     — https://api.chapa.co/v1
 *   APP_URL            — your frontend base URL (e.g. http://localhost:5173)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const pool   = require('../db');

const BASE      = process.env.CHAPA_BASE_URL  || 'https://api.chapa.co/v1';
const WH_SECRET = process.env.CHAPA_WEBHOOK_SECRET;
const APP_URL   = process.env.APP_URL || 'http://localhost:5173';

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: call Chapa REST API
// ─────────────────────────────────────────────────────────────────────────────
const chapaFetch = async (path, options = {}) => {
  // Read key at call time so hot-reload / dotenv late-loading works
  const SECRET = process.env.CHAPA_SECRET_KEY;

  if (!SECRET || SECRET.includes('xxxxxxx')) {
    throw Object.assign(
      new Error('Chapa is not configured. Set CHAPA_SECRET_KEY in backend/.env'),
      { status: 503 }
    );
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${SECRET}`,
      'Content-Type':  'application/json',
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  console.log('[chapa] response:', res.status, JSON.stringify(body).slice(0, 300));
  if (!res.ok) {
    const msg = (typeof body?.message === 'string' ? body.message : null)
      || (typeof body?.error === 'string' ? body.error : null)
      || JSON.stringify(body)
      || `Chapa error ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status, chapaBody: body });
  }
  return body;
};

// ─────────────────────────────────────────────────────────────────────────────
// initializeTransaction()
// Calls Chapa POST /transaction/initialize
// Returns { checkout_url, tx_ref }
// ─────────────────────────────────────────────────────────────────────────────
const initializeTransaction = async ({ invoiceId, amount, currency = 'ETB', email, firstName, lastName, phone, tx_ref }) => {
  // Generate a unique tx_ref if not provided
  const ref = tx_ref || `EDUFLOW-${invoiceId.slice(0, 8).toUpperCase()}-${Date.now()}`;

  const payload = {
    amount:        String(parseFloat(amount).toFixed(2)),
    currency,
    email:         email || 'parent@school.com',
    first_name:    firstName || 'Parent',
    last_name:     lastName  || 'User',
    phone_number:  phone     || '',
    tx_ref:        ref,
    callback_url:  `${APP_URL.replace(/\/$/, '')}/parent/fees?tx_ref=${ref}&invoice_id=${invoiceId}`,
    return_url:    `${APP_URL.replace(/\/$/, '')}/parent/fees?tx_ref=${ref}&invoice_id=${invoiceId}`,
    customization: {
      title:       'School Fee',
      description: 'Invoice_payment_Haile-Manas',
    },
  };

  const data = await chapaFetch('/transaction/initialize', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  const checkoutUrl = data?.data?.checkout_url;
  if (!checkoutUrl) {
    throw new Error('Chapa did not return a checkout URL. Check your API key and payload.');
  }

  // Persist tx_ref + checkout_url + gateway_status=PENDING on the invoice
  await pool.query(
    `UPDATE fee_invoices
     SET tx_ref = $1, checkout_url = $2, gateway_status = 'PENDING', updated_at = NOW()
     WHERE id = $3`,
    [ref, checkoutUrl, invoiceId]
  );

  return { checkout_url: checkoutUrl, tx_ref: ref };
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyTransaction()
// Calls Chapa GET /transaction/verify/:tx_ref
// Returns Chapa's status + amount
// Used as webhook fallback and for manual reconciliation
// ─────────────────────────────────────────────────────────────────────────────
const verifyTransaction = async (tx_ref) => {
  const data = await chapaFetch(`/transaction/verify/${encodeURIComponent(tx_ref)}`);
  return data?.data || data;
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyWebhookSignature()
// Chapa signs the webhook body with HMAC-SHA256 using your webhook secret.
// Header: Chapa-Signature (or x-chapa-signature depending on version)
// NEVER process a webhook that fails this check.
// ─────────────────────────────────────────────────────────────────────────────
const verifyWebhookSignature = (rawBody, signature) => {
  if (!WH_SECRET || WH_SECRET.includes('your-webhook')) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[chapa] CHAPA_WEBHOOK_SECRET not set — rejecting webhook in production');
      return false;
    }
    console.warn('[chapa] CHAPA_WEBHOOK_SECRET not configured — skipping signature check in dev');
    return true;
  }

  // Normalize rawBody to string regardless of what Express passes in
  let bodyStr;
  if (Buffer.isBuffer(rawBody)) {
    bodyStr = rawBody.toString('utf8');
  } else if (typeof rawBody === 'string') {
    bodyStr = rawBody;
  } else {
    // Fallback: serialize object (less secure but won't crash)
    bodyStr = JSON.stringify(rawBody);
  }

  const expected = crypto
    .createHmac('sha256', WH_SECRET)
    .update(bodyStr)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature || '', 'hex')
    );
  } catch (_) {
    return false;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// processSuccessfulPayment()
// Called after a confirmed SUCCESS from Chapa (webhook or verify fallback).
// Records fee_payments row, syncs invoice status, fires notification.
// Idempotent — checks tx_ref uniqueness before inserting.
// ─────────────────────────────────────────────────────────────────────────────
const processSuccessfulPayment = async (tx_ref, chapaData) => {
  // Look up invoice by tx_ref
  const { rows: invRows } = await pool.query(
    `SELECT * FROM fee_invoices WHERE tx_ref = $1`, [tx_ref]
  );
  if (!invRows.length) {
    throw Object.assign(new Error(`No invoice found for tx_ref: ${tx_ref}`), { status: 404 });
  }
  const invoice = invRows[0];

  // Idempotency — skip if already recorded
  const { rows: existing } = await pool.query(
    `SELECT id FROM fee_payments WHERE transaction_reference = $1`, [tx_ref]
  );
  if (existing.length) {
    console.log(`[chapa] Duplicate webhook for tx_ref ${tx_ref} — skipped`);
    return { duplicate: true, invoice_id: invoice.id };
  }

  const amount   = parseFloat(chapaData?.amount || invoice.balance);
  const currency = chapaData?.currency || invoice.currency;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Generate receipt number
    const year = new Date().getFullYear();
    const { rows: cnt } = await client.query(
      `SELECT COUNT(*) AS c FROM fee_payments WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
    );
    const receiptNumber = `RCP-${year}-${String(parseInt(cnt[0].c) + 1).padStart(5, '0')}`;

    // Insert payment
    const { rows: pmtRows } = await client.query(
      `INSERT INTO fee_payments
         (fee_invoice_id, amount, payment_method, transaction_reference,
          receipt_number, notes)
       VALUES ($1, $2, 'GATEWAY', $3, $4, $5)
       RETURNING *`,
      [invoice.id, amount, tx_ref, receiptNumber, `Chapa gateway — ${chapaData?.status || 'success'}`]
    );

    // Update invoice — amount_paid, status, gateway_status
    await client.query(
      `UPDATE fee_invoices
       SET amount_paid      = amount_paid + $1,
           gateway_status   = 'SUCCESS',
           status = CASE
             WHEN amount_paid + $1 >= total_amount THEN 'PAID'
             WHEN amount_paid + $1 > 0             THEN 'PARTIAL'
             ELSE status
           END,
           updated_at = NOW()
       WHERE id = $2`,
      [amount, invoice.id]
    );

    await client.query('COMMIT');

    // Fire notification (non-blocking)
    try {
      const notifSvc = require('./notificationService');
      const { rows: parents } = await pool.query(
        `SELECT pu.id FROM users pu
         JOIN parents p ON p.user_id = pu.id
         JOIN student_parents sp ON sp.parent_id = p.id
         WHERE sp.student_id = $1 AND pu.status = 'ACTIVE'`,
        [invoice.student_id]
      );
      for (const { id } of parents) {
        notifSvc.dispatch(id, 'payment_confirmation', {
          title:   'Payment Confirmed',
          body:    `Your Chapa payment of ${currency} ${amount.toLocaleString()} was successful. Receipt: ${receiptNumber}.`,
          link:    '/parent/fees',
          refType: 'fee_invoice',
          refId:   invoice.id,
        }).catch(() => {});
      }
    } catch (_) {}

    return { success: true, invoice_id: invoice.id, receipt_number: receiptNumber, payment: pmtRows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  processSuccessfulPayment,
};
