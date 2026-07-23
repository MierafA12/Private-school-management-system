/**
 * Migration: Create users table
 * Purpose: Authentication and account management only.
 */

exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    role_id: {
      type: 'UUID',
      notNull: true,
      references: '"roles"',
      onDelete: 'RESTRICT', // cannot delete a role that has users
    },
    email: {
      type: 'VARCHAR(255)',
      unique: true,
      notNull: false,
    },
    phone: {
      type: 'VARCHAR(20)',
      unique: true,
      notNull: false,
    },
    password_hash: {
      type: 'TEXT',
      notNull: true,
    },
    status: {
      type: 'VARCHAR(20)',
      default: "'ACTIVE'",
      notNull: true,
    },
    email_verified: {
      type: 'BOOLEAN',
      default: false,
    },
    phone_verified: {
      type: 'BOOLEAN',
      default: false,
    },
    last_login: {
      type: 'TIMESTAMP',
      notNull: false,
    },
    failed_login_attempts: {
      type: 'INTEGER',
      default: 0,
    },
    password_changed_at: {
      type: 'TIMESTAMP',
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

  // At least one of email or phone must be provided
  pgm.addConstraint(
    'users',
    'chk_users_email_or_phone',
    'CHECK (email IS NOT NULL OR phone IS NOT NULL)'
  );

  // status must be one of the allowed values
  pgm.addConstraint(
    'users',
    'chk_users_status',
    "CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'))"
  );

  pgm.createIndex('users', 'role_id');
  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'phone');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
