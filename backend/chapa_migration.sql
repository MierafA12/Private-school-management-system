-- ============================================================
-- Chapa Payment Gateway — Migration
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add gateway tracking columns to fee_invoices
ALTER TABLE fee_invoices
  ADD COLUMN IF NOT EXISTS tx_ref          VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS gateway_status  VARCHAR(30)  DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS checkout_url    TEXT;

-- gateway_status values: NONE | PENDING | SUCCESS | FAILED | CANCELLED
ALTER TABLE fee_invoices
  ADD CONSTRAINT chk_fee_invoices_gateway_status
  CHECK (gateway_status IN ('NONE','PENDING','SUCCESS','FAILED','CANCELLED'));

-- Index for fast webhook lookup by tx_ref
CREATE INDEX IF NOT EXISTS idx_fee_invoices_tx_ref ON fee_invoices(tx_ref);

-- ============================================================
-- Done.
-- ============================================================
