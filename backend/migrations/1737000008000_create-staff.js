/**
 * Migration: Create staff table
 * Purpose: Represents Principal, Registrar, Accountant, and other non-teaching
 *          employees. The specific role comes from users.role_id.
 */

exports.up = (pgm) => {
  pgm.createTable('staff', {
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
    phone_number: {
      type: 'VARCHAR(20)',
      notNull: false,
    },
    address: {
      type: 'TEXT',
      notNull: false,
    },
    department: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    office_location: {
      type: 'VARCHAR(100)',
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
    'staff',
    'chk_staff_employment_status',
    "CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED', 'RETIRED'))"
  );

  pgm.createIndex('staff', 'user_id');
  pgm.createIndex('staff', 'employee_number');
};

exports.down = (pgm) => {
  pgm.dropTable('staff');
};
