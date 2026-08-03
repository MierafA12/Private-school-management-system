/**
 * Migration: Create students table
 * Purpose: Student profile and academic identity.
 */

exports.up = (pgm) => {
  pgm.createTable('students', {
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
    student_number: {
      type: 'VARCHAR(50)',
      unique: true,
      notNull: false,
    },
    admission_number: {
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
      notNull: true,
    },
    blood_group: {
      type: 'VARCHAR(10)',
      notNull: false,
    },
    nationality: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    religion: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    profile_photo: {
      type: 'TEXT',
      notNull: false,
    },
    address: {
      type: 'TEXT',
      notNull: true,
    },
    emergency_contact_name: {
      type: 'VARCHAR(150)',
      notNull: true,
    },
    emergency_contact_phone: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    admission_date: {
      type: 'DATE',
      notNull: true,
    },
    previous_school: {
      type: 'VARCHAR(255)',
      notNull: false,
    },
    current_status: {
      type: 'VARCHAR(30)',
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
    'students',
    'chk_students_gender',
    "CHECK (gender IN ('Male', 'Female', 'Other'))"
  );

  pgm.addConstraint(
    'students',
    'chk_students_status',
    "CHECK (current_status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'EXPELLED', 'SUSPENDED'))"
  );

  pgm.createIndex('students', 'user_id');
  pgm.createIndex('students', 'student_number');
};

exports.down = (pgm) => {
  pgm.dropTable('students');
};
