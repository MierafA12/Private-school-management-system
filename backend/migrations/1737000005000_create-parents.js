/**
 * Migration: Create parents table
 * Purpose: Parent/Guardian profile.
 */

exports.up = (pgm) => {
  pgm.createTable('parents', {
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
      notNull: false,
    },
    relationship: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    occupation: {
      type: 'VARCHAR(150)',
      notNull: false,
    },
    employer: {
      type: 'VARCHAR(150)',
      notNull: false,
    },
    national_id: {
      type: 'VARCHAR(100)',
      notNull: false,
    },
    address: {
      type: 'TEXT',
      notNull: true,
    },
    emergency_phone: {
      type: 'VARCHAR(20)',
      notNull: false,
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

  pgm.createIndex('parents', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('parents');
};
