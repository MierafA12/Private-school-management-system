/**
 * Migration: Create report_cards and report_card_items tables
 * Purpose:
 *   report_cards      — one row per student per term (overall summary).
 *   report_card_items — one row per subject inside a report card.
 */

exports.up = (pgm) => {
  // ── report_cards ────────────────────────────────────────────────────────────
  pgm.createTable('report_cards', {
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
    term_id: {
      type: 'UUID',
      notNull: true,
      references: '"terms"',
      onDelete: 'RESTRICT',
    },
    enrollment_id: {
      type: 'UUID',
      notNull: true,
      references: '"enrollments"',
      onDelete: 'RESTRICT',
    },
    total_marks: {
      type: 'NUMERIC(8,2)',
      notNull: false,
    },
    total_percentage: {
      type: 'NUMERIC(5,2)',
      notNull: false,
    },
    overall_grade: {
      type: 'VARCHAR(10)',
      notNull: false,
    },
    class_rank: {
      type: 'INTEGER',
      notNull: false,
    },
    is_promoted: {
      type: 'BOOLEAN',
      notNull: false,
    },
    advisor_remarks: {
      type: 'TEXT',
      notNull: false,
    },
    principal_remarks: {
      type: 'TEXT',
      notNull: false,
    },
    is_published: {
      type: 'BOOLEAN',
      default: false,
      notNull: true,
    },
    published_at: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    generated_by: {
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
    'report_cards',
    'uq_report_cards_student_term',
    'UNIQUE (student_id, term_id)'
  );

  pgm.createIndex('report_cards', 'student_id');
  pgm.createIndex('report_cards', 'term_id');
  pgm.createIndex('report_cards', 'enrollment_id');

  // ── report_card_items ────────────────────────────────────────────────────────
  pgm.createTable('report_card_items', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    report_card_id: {
      type: 'UUID',
      notNull: true,
      references: '"report_cards"',
      onDelete: 'CASCADE',
    },
    curriculum_subject_id: {
      type: 'UUID',
      notNull: true,
      references: '"curriculum_subjects"',
      onDelete: 'RESTRICT',
    },
    teacher_id: {
      type: 'UUID',
      notNull: false,
      references: '"teachers"',
      onDelete: 'SET NULL',
    },
    total_marks: {
      type: 'NUMERIC(6,2)',
      notNull: false,
    },
    percentage: {
      type: 'NUMERIC(5,2)',
      notNull: false,
    },
    letter_grade: {
      type: 'VARCHAR(5)',
      notNull: false,
    },
    is_passed: {
      type: 'BOOLEAN',
      notNull: false,
    },
    teacher_remarks: {
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
    'report_card_items',
    'uq_report_card_items_card_subject',
    'UNIQUE (report_card_id, curriculum_subject_id)'
  );

  pgm.createIndex('report_card_items', 'report_card_id');
  pgm.createIndex('report_card_items', 'curriculum_subject_id');
};

exports.down = (pgm) => {
  pgm.dropTable('report_card_items');
  pgm.dropTable('report_cards');
};
