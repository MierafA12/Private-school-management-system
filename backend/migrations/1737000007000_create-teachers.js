/**
 * Migration: Create teachers table
 * Purpose: Teacher profile.
 */

exports.up = (pgm) => {
  pgm.createTable('teachers', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'UUID',
      notNull: true,
      unique: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    employee_number: {
      type: 'VARCHAR(50)',
      unique: true,
      notNull: false,
    },
    first_name: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    middle_name: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    last_name: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    gender: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    date_of_birth: {
      type: 'DATE',
      notNull: false,
    },
    qualification: {
      type: 'VARCHAR(255)',
      notNull: true,
    },
    specialization: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
    years_of_experience: {
      type: 'INTEGER',
      default: 0,
    },
    phone_number: {
      type: 'VARCHAR(20)',
      notNull: false,
    },
    address: {
      type: 'TEXT',
      notNull: false,
    },
    hire_date: {
      type: 'DATE',
      notNull: true,
    },
    employment_status: {
      type: 'VARCHAR(30)',
      default: "'ACTIVE'",
      notNull: true,
    },
    profile_photo: {
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
    'teachers',
    'chk_teachers_employment_status',
    "CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'RETIRED'))"
  );

  pgm.createIndex('teachers', 'user_id');
  pgm.createIndex('teachers', 'employee_number');
};

exports.down = (pgm) => {
  pgm.dropTable('teachers');
};
