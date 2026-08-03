/**
 * Migration: Create student_parents table
 * Purpose: Links parents to students (M:N). A parent can have multiple students;
 *          a student can have multiple parents/guardians.
 */

exports.up = (pgm) => {
  pgm.createTable('student_parents', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    student_id: {
      type: 'UUID',
      notNull: true,
      references: '"students"',
      onDelete: 'CASCADE',
    },
    parent_id: {
      type: 'UUID',
      notNull: true,
      references: '"parents"',
      onDelete: 'CASCADE',
    },
    is_primary_contact: {
      type: 'BOOLEAN',
      default: false,
    },
    created_at: {
      type: 'TIMESTAMP',
      default: pgm.func('NOW()'),
      notNull: true,
    },
  });

  // A parent cannot be linked to the same student twice
  pgm.addConstraint(
    'student_parents',
    'uq_student_parents_student_parent',
    'UNIQUE (student_id, parent_id)'
  );

  pgm.createIndex('student_parents', 'student_id');
  pgm.createIndex('student_parents', 'parent_id');
};

exports.down = (pgm) => {
  pgm.dropTable('student_parents');
};
