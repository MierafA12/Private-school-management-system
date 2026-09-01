/**
 * Migration: Create school_profile table
 * Purpose: Stores school identity and configuration settings.
 *          Only one row should exist (singleton).
 */

exports.up = (pgm) => {
  pgm.createTable('school_profile', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'VARCHAR(200)',
      notNull: true,
    },
    motto: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
    logo_url: {
      type: 'TEXT',
      notNull: false,
    },
    address: {
      type: 'TEXT',
      notNull: false,
    },
    city: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    country: {
      type: 'VARCHAR(100)',
      notNull: false,
      default: "'Kenya'",
    },
    phone: {
      type: 'VARCHAR(30)',
      notNull: false,
    },
    email: {
      type: 'VARCHAR(200)',
      notNull: false,
    },
    website: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
    registration_number: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    principal_name: {
      type: 'VARCHAR(150)',
      notNull: false,
    },
    currency: {
      type: 'VARCHAR(5)',
      notNull: true,
      default: "'KES'",
    },
    academic_year_start_month: {
      type: 'INTEGER',
      notNull: true,
      default: 1,   // January
    },
    terms_per_year: {
      type: 'INTEGER',
      notNull: true,
      default: 3,
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

  // Seed a default school profile
  pgm.sql(`
    INSERT INTO school_profile (name, country, currency, terms_per_year)
    VALUES ('EduFlow Private School', 'Kenya', 'KES', 3);
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('school_profile');
};
