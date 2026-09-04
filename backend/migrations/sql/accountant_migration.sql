-- ============================================================
-- Accountant Portal — Migration
-- Run AFTER supabase_migration.sql AND parent_portal_migration.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. FEE_STRUCTURES
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID          NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  term_id          UUID          REFERENCES terms(id) ON DELETE RESTRICT,
  class_id         UUID          REFERENCES classes(id) ON DELETE RESTRICT,
  category         VARCHAR(100)  NOT NULL,
  description      TEXT,
  amount           DECIMAL(12,2) NOT NULL,
  currency         VARCHAR(10)   DEFAULT 'KES' NOT NULL,
  is_mandatory     BOOLEAN       DEFAULT TRUE,
  status           VARCHAR(20)   DEFAULT 'ACTIVE' NOT NULL,
  archived_at      TIMESTAMP,
  created_by       UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_fee_structures_status CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  CONSTRAINT chk_fee_structures_amount CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_fee_structures_year_id  ON fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_term_id  ON fee_structures(term_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_status   ON fee_structures(status);

-- ============================================================
-- 2. FEE_INSTALLMENT_PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_installment_plans (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_invoice_id UUID          NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  installment_no INTEGER       NOT NULL,
  amount_due     DECIMAL(12,2) NOT NULL,
  due_date       DATE          NOT NULL,
  status         VARCHAR(20)   DEFAULT 'PENDING' NOT NULL,
  paid_at        TIMESTAMP,
  created_at     TIMESTAMP     DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_fee_installment_status
    CHECK (status IN ('PENDING','PAID','OVERDUE','WAIVED')),
  CONSTRAINT uq_fee_installment_invoice_no UNIQUE (fee_invoice_id, installment_no)
);
CREATE INDEX IF NOT EXISTS idx_fee_installment_invoice_id ON fee_installment_plans(fee_invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_installment_due_date   ON fee_installment_plans(due_date);

-- ============================================================
-- Add fee_structure_id reference to fee_invoices if missing
-- ============================================================
ALTER TABLE fee_invoices
  ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL;

-- ============================================================
-- Done. 2 new tables + 1 column added.
-- ============================================================
