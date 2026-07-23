/**
 * Migration: Create academic_years table
 * Purpose: Stores all academic years. Only one can be current at a time.
 */

exports.up = (pgm) => {
  pgm.createTable('academic_years', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'VARCHAR(50)',
      notNull: true,
      unique: true,
    },
    start_date: {
      type: 'DATE',
      notNull: true,
    },
    end_date: {
      type: 'DATE',
      notNull: true,
    },
    is_current: {
      type: 'BOOLEAN',
      default: false,
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
    'academic_years',
    'chk_academic_years_dates',
    'CHECK (end_date > start_date)'
  );

  // Enforce only one current academic year via a partial unique index
  pgm.sql(`
    CREATE UNIQUE INDEX uq_academic_years_one_current
      ON academic_years (is_current)
      WHERE is_current = TRUE;
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('academic_years');
};
