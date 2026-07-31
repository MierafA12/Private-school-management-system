/**
 * Migration: Create fees tables
 *
 *   fee_structures  — defines fee types and amounts per class/academic year.
 *   fee_invoices    — one invoice per student per term (what they owe).
 *   fee_payments    — individual payment transactions against an invoice.
 */

exports.up = (pgm) => {
  // ── fee_structures ──────────────────────────────────────────────────────────
  pgm.createTable('fee_structures', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    academic_year_id: {
      type: 'UUID',
      notNull: true,
      references: '"academic_years"',
      onDelete: 'CASCADE',
    },
    class_id: {
      type: 'UUID',
      notNull: false,       // NULL = applies to all classes
      references: '"classes"',
      onDelete: 'SET NULL',
    },
    fee_type: {
      type: 'VARCHAR(80)',
      notNull: true,
    },
    amount: {
      type: 'NUMERIC(12,2)',
      notNull: true,
    },
    currency: {
      type: 'VARCHAR(5)',
      default: "'KES'",
      notNull: true,
    },
    due_date: {
      type: 'DATE',
      notNull: false,
    },
    description: {
      type: 'TEXT',
      notNull: false,
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
    updated_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  pgm.addConstraint(
    'fee_structures',
    'chk_fee_structures_amount',
    'CHECK (amount >= 0)'
  );

  pgm.createIndex('fee_structures', 'academic_year_id');
  pgm.createIndex('fee_structures', 'class_id');

  // ── fee_invoices ────────────────────────────────────────────────────────────
  pgm.createTable('fee_invoices', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'UUID',
      notNull: true,
      references: '"students"',
      onDelete: 'CASCADE',
    },
    enrollment_id: {
      type: 'UUID',
      notNull: true,
      references: '"enrollments"',
      onDelete: 'RESTRICT',
    },
    term_id: {
      type: 'UUID',
      notNull: true,
      references: '"terms"',
      onDelete: 'RESTRICT',
    },
    invoice_number: {
      type: 'VARCHAR(60)',
      notNull: true,
      unique: true,
    },
    total_amount: {
      type: 'NUMERIC(12,2)',
      notNull: true,
    },
    amount_paid: {
      type: 'NUMERIC(12,2)',
      default: 0,
      notNull: true,
    },
    balance: {
      type: 'NUMERIC(12,2)',
      notNull: true,
    },
    currency: {
      type: 'VARCHAR(5)',
      default: "'KES'",
      notNull: true,
    },
    due_date: {
      type: 'DATE',
      notNull: false,
    },
    status: {
      type: 'VARCHAR(20)',
      default: "'UNPAID'",
      notNull: true,
    },
    notes: {
      type: 'TEXT',
      notNull: false,
    },
    created_by: {
      type: 'UUID',
      notNull: false,
      references: '"users"',
      onDelete: 'SET NULL',
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
    updated_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  pgm.addConstraint(
    'fee_invoices',
    'chk_fee_invoices_status',
    "CHECK (status IN ('UNPAID','PARTIAL','PAID','OVERDUE','WAIVED','CANCELLED'))"
  );

  pgm.addConstraint(
    'fee_invoices',
    'chk_fee_invoices_amounts',
    'CHECK (total_amount >= 0 AND amount_paid >= 0)'
  );

  pgm.createIndex('fee_invoices', 'student_id');
  pgm.createIndex('fee_invoices', 'term_id');
  pgm.createIndex('fee_invoices', 'enrollment_id');
  pgm.createIndex('fee_invoices', 'status');

  // ── fee_payments ────────────────────────────────────────────────────────────
  pgm.createTable('fee_payments', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    fee_invoice_id: {
      type: 'UUID',
      notNull: true,
      references: '"fee_invoices"',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: 'UUID',
      notNull: true,
      references: '"students"',
      onDelete: 'CASCADE',
    },
    amount: {
      type: 'NUMERIC(12,2)',
      notNull: true,
    },
    payment_date: {
      type: 'DATE',
      notNull: true,
    },
    payment_method: {
      type: 'VARCHAR(40)',
      notNull: true,
    },
    transaction_reference: {
      type: 'VARCHAR(150)',
      notNull: false,
    },
    received_by: {
      type: 'UUID',
      notNull: false,
      references: '"users"',
      onDelete: 'SET NULL',
    },
    notes: {
      type: 'TEXT',
      notNull: false,
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  pgm.addConstraint(
    'fee_payments',
    'chk_fee_payments_method',
    "CHECK (payment_method IN ('CASH','MPESA','BANK_TRANSFER','CHEQUE','CARD','OTHER'))"
  );

  pgm.addConstraint(
    'fee_payments',
    'chk_fee_payments_amount',
    'CHECK (amount > 0)'
  );

  pgm.createIndex('fee_payments', 'fee_invoice_id');
  pgm.createIndex('fee_payments', 'student_id');
  pgm.createIndex('fee_payments', 'payment_date');
};

exports.down = (pgm) => {
  pgm.dropTable('fee_payments');
  pgm.dropTable('fee_invoices');
  pgm.dropTable('fee_structures');
};
