/**
 * Migration: Create classes table
 * Purpose: Stores grade levels (Nursery, KG1, Grade 1 … Grade 12).
 */

exports.up = (pgm) => {
  pgm.createTable('classes', {
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
    grade_level: {
      type: 'INTEGER',
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
  pgm.dropTable('classes');
};
