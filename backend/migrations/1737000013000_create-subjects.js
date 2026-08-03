/**
 * Migration: Create subjects table
 * Purpose: Master list of school subjects.
 */

exports.up = (pgm) => {
  pgm.createTable('subjects', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    code: {
      type: 'VARCHAR(30)',
      unique: true,
      notNull: true,
    },
    name: {
      type: 'VARCHAR(100)',
      notNull: true,
    },
    description: {
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
};

exports.down = (pgm) => {
  pgm.dropTable('subjects');
};
