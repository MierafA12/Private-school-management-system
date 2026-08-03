/**
 * Migration: Create terms table
 * Purpose: Stores semesters/terms within an academic year.
 */

exports.up = (pgm) => {
  pgm.createTable('terms', {
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
    name: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    start_date: {
      type: 'DATE',
      notNull: true,
    },
    end_date: {
      type: 'DATE',
      notNull: true,
    },
    status: {
      type: 'VARCHAR(20)',
      default: "'ACTIVE'",
      notNull: true,
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
    'terms',
    'chk_terms_dates',
    'CHECK (end_date > start_date)'
  );

  // Term name must be unique within an academic year
  pgm.addConstraint(
    'terms',
    'uq_terms_name_per_year',
    'UNIQUE (academic_year_id, name)'
  );

  pgm.createIndex('terms', 'academic_year_id');
};

exports.down = (pgm) => {
  pgm.dropTable('terms');
};
