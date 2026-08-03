/**
 * Migration: Create role_permissions table
 * Purpose: Maps permissions to roles (RBAC join table).
 */

exports.up = (pgm) => {
  pgm.createTable('role_permissions', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    role_id: {
      type: 'UUID',
      notNull: true,
      references: '"roles"',
      onDelete: 'CASCADE',
    },
    permission_id: {
      type: 'UUID',
      notNull: true,
      references: '"permissions"',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  // Prevent duplicate permission assignments to the same role
  pgm.addConstraint(
    'role_permissions',
    'uq_role_permissions_role_permission',
    'UNIQUE (role_id, permission_id)'
  );

  pgm.createIndex('role_permissions', 'role_id');
  pgm.createIndex('role_permissions', 'permission_id');
};

exports.down = (pgm) => {
  pgm.dropTable('role_permissions');
};
