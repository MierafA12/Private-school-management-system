/**
 * Migration: Create roles table
 * Purpose: Stores all system roles used for RBAC.
 */

exports.up = (pgm) => {
  // Enable pgcrypto for gen_random_uuid() if not already enabled
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  pgm.createTable('roles', {
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
    description: {
      type: 'TEXT',
      notNull: false,
    },
    is_system_role: {
      type: 'BOOLEAN',
      default: true,
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

  // Seed built-in system roles
  pgm.sql(`
    INSERT INTO roles (name, description, is_system_role, status) VALUES
      ('Super Admin',  'Full system access',                          TRUE, 'ACTIVE'),
      ('Principal',    'School principal with broad permissions',     TRUE, 'ACTIVE'),
      ('Registrar',    'Manages student records and enrollment',      TRUE, 'ACTIVE'),
      ('Accountant',   'Manages fees and financial records',          TRUE, 'ACTIVE'),
      ('Teacher',      'Classroom teacher',                           TRUE, 'ACTIVE'),
      ('Student',      'Enrolled student',                            TRUE, 'ACTIVE'),
      ('Parent',       'Parent or guardian of a student',             TRUE, 'ACTIVE');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('roles');
};
