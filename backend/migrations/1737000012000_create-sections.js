/**
 * Migration: Create sections table
 * Purpose: Stores sections under each class (e.g. Grade 7 → A, B, C).
 */

exports.up = (pgm) => {
  pgm.createTable('sections', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    class_id: {
      type: 'UUID',
      notNull: true,
      references: '"classes"',
      onDelete: 'CASCADE',
    },
    name: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    room_number: {
      type: 'VARCHAR(30)',
      notNull: false,
    },
    capacity: {
      type: 'INTEGER',
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

  // Section name must be unique within a class
  pgm.addConstraint(
    'sections',
    'uq_sections_name_per_class',
    'UNIQUE (class_id, name)'
  );

  pgm.createIndex('sections', 'class_id');
};

exports.down = (pgm) => {
  pgm.dropTable('sections');
};
