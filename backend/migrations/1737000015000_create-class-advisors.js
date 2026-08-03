/**
 * Migration: Create class_advisors table
 * Purpose: Assigns a homeroom/form teacher to a class section for an academic year.
 */

exports.up = (pgm) => {
  pgm.createTable('class_advisors', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    academic_year_id: {
      type: 'UUID',
      notNull: true,
      references: '"academic_years"',
      onDelete: 'CASCADE',
    },
    class_id: {
      type: 'UUID',
      notNull: true,
      references: '"classes"',
      onDelete: 'CASCADE',
    },
    section_id: {
      type: 'UUID',
      notNull: true,
      references: '"sections"',
      onDelete: 'CASCADE',
    },
    teacher_id: {
      type: 'UUID',
      notNull: true,
      references: '"teachers"',
      onDelete: 'RESTRICT',
    },
    assigned_date: {
      type: 'DATE',
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

  // One advisor per class/section/year
  pgm.addConstraint(
    'class_advisors',
    'uq_class_advisors_section_year',
    'UNIQUE (academic_year_id, section_id)'
  );

  pgm.createIndex('class_advisors', ['academic_year_id', 'class_id', 'section_id']);
  pgm.createIndex('class_advisors', 'teacher_id');
};

exports.down = (pgm) => {
  pgm.dropTable('class_advisors');
};
