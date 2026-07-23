/**
 * Migration: Create enrollments table
 * Purpose: Records a student's class assignment for every academic year.
 *          Student promotion = new enrollment record (never update existing).
 */

exports.up = (pgm) => {
  pgm.createTable('enrollments', {
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
    academic_year_id: {
      type: 'UUID',
      notNull: true,
      references: '"academic_years"',
      onDelete: 'RESTRICT',
    },
    class_id: {
      type: 'UUID',
      notNull: true,
      references: '"classes"',
      onDelete: 'RESTRICT',
    },
    section_id: {
      type: 'UUID',
      notNull: true,
      references: '"sections"',
      onDelete: 'RESTRICT',
    },
    roll_number: {
      type: 'VARCHAR(30)',
      notNull: false,
    },
    enrollment_date: {
      type: 'DATE',
      notNull: true,
    },
    enrollment_status: {
      type: 'VARCHAR(30)',
      default: "'ACTIVE'",
      notNull: true,
    },
    // Self-referencing FK: tracks which previous enrollment was promoted
    promoted_from_enrollment_id: {
      type: 'UUID',
      notNull: false,
      references: '"enrollments"',
      onDelete: 'SET NULL',
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

  // One active enrollment per student per academic year
  pgm.addConstraint(
    'enrollments',
    'uq_enrollments_student_year',
    'UNIQUE (student_id, academic_year_id)'
  );

  pgm.addConstraint(
    'enrollments',
    'chk_enrollments_status',
    "CHECK (enrollment_status IN ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED', 'REPEATED', 'WITHDRAWN'))"
  );

  pgm.createIndex('enrollments', 'student_id');
  pgm.createIndex('enrollments', 'academic_year_id');
  pgm.createIndex('enrollments', ['class_id', 'section_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('enrollments');
};
