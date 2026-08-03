/**
 * Migration: Create curriculum_subjects table
 * Purpose: Defines which subjects belong to each class in a specific academic year.
 *          Example: For 2026/2027, Grade 7 teaches Mathematics, Physics, Chemistry, ICT.
 */

exports.up = (pgm) => {
  pgm.createTable('curriculum_subjects', {
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
      notNull: true,
      references: '"classes"',
      onDelete: 'CASCADE',
    },
    subject_id: {
      type: 'UUID',
      notNull: true,
      references: '"subjects"',
      onDelete: 'CASCADE',
    },
    is_core: {
      type: 'BOOLEAN',
      default: true,
    },
    weekly_periods: {
      type: 'INTEGER',
      default: 5,
    },
    pass_mark: {
      type: 'DECIMAL(5,2)',
      default: 50,
    },
    max_mark: {
      type: 'DECIMAL(5,2)',
      default: 100,
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

  // A subject cannot appear twice in the same class/year combination
  pgm.addConstraint(
    'curriculum_subjects',
    'uq_curriculum_subjects_year_class_subject',
    'UNIQUE (academic_year_id, class_id, subject_id)'
  );

  pgm.createIndex('curriculum_subjects', 'academic_year_id');
  pgm.createIndex('curriculum_subjects', 'class_id');
  pgm.createIndex('curriculum_subjects', 'subject_id');
};

exports.down = (pgm) => {
  pgm.dropTable('curriculum_subjects');
};
