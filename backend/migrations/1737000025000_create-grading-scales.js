/**
 * Migration: Create grading_scales table
 * Purpose: Defines letter grades, GPA equivalents, and pass/fail thresholds
 *          for the school. Each school can have its own grading scale.
 *          Example: A+ = 90-100, A = 80-89, B+ = 70-79 ...
 */

exports.up = (pgm) => {
  pgm.createTable('grading_scales', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'VARCHAR(20)',
      notNull: true,             // e.g. "A+", "A", "B+"
    },
    min_percentage: {
      type: 'NUMERIC(5,2)',
      notNull: true,
    },
    max_percentage: {
      type: 'NUMERIC(5,2)',
      notNull: true,
    },
    label: {
      type: 'VARCHAR(50)',
      notNull: false,            // e.g. "Excellent", "Good", "Average"
    },
    is_pass: {
      type: 'BOOLEAN',
      notNull: true,
      default: true,
    },
    sort_order: {
      type: 'INTEGER',
      notNull: true,
      default: 0,
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
    'grading_scales',
    'chk_grading_scales_range',
    'CHECK (min_percentage >= 0 AND max_percentage <= 100 AND max_percentage > min_percentage)'
  );

  pgm.addConstraint(
    'grading_scales',
    'uq_grading_scales_name',
    'UNIQUE (name)'
  );

  pgm.createIndex('grading_scales', 'min_percentage');

  // Seed default grading scale
  pgm.sql(`
    INSERT INTO grading_scales (name, min_percentage, max_percentage, label, is_pass, sort_order) VALUES
      ('A+',  90, 100, 'Excellent',       TRUE,  1),
      ('A',   80,  89, 'Very Good',       TRUE,  2),
      ('B+',  75,  79, 'Good',            TRUE,  3),
      ('B',   70,  74, 'Above Average',   TRUE,  4),
      ('C+',  65,  69, 'Average',         TRUE,  5),
      ('C',   60,  64, 'Satisfactory',    TRUE,  6),
      ('D',   50,  59, 'Below Average',   TRUE,  7),
      ('F',    0,  49, 'Fail',            FALSE, 8);
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('grading_scales');
};
