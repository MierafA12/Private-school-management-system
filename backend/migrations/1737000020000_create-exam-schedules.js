/**
 * Migration: Create exam_schedules table
 * Purpose: Defines exam events (name, date, subject, section, term) visible
 *          to students as a schedule. No scoring or results — schedule only.
 */

exports.up = (pgm) => {
  pgm.createTable('exam_schedules', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    term_id: {
      type: 'UUID',
      notNull: true,
      references: '"terms"',
      onDelete: 'CASCADE',
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
    curriculum_subject_id: {
      type: 'UUID',
      notNull: true,
      references: '"curriculum_subjects"',
      onDelete: 'CASCADE',
    },
    // The name/title of the exam e.g. "Term 1 Mathematics Exam"
    title: {
      type: 'VARCHAR(200)',
      notNull: true,
    },
    exam_date: {
      type: 'DATE',
      notNull: true,
    },
    start_time: {
      type: 'TIME',
      notNull: false,
    },
    end_time: {
      type: 'TIME',
      notNull: false,
    },
    venue: {
      type: 'VARCHAR(150)',
      notNull: false,
    },
    // Additional notes the admin wants students to see (e.g. "Bring calculator")
    notes: {
      type: 'TEXT',
      notNull: false,
    },
    is_published: {
      type: 'BOOLEAN',
      default: false,
      notNull: true,
    },
    created_by: {
      type: 'UUID',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
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

  pgm.addConstraint(
    'exam_schedules',
    'chk_exam_schedules_times',
    'CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)'
  );

  pgm.createIndex('exam_schedules', 'term_id');
  pgm.createIndex('exam_schedules', 'academic_year_id');
  pgm.createIndex('exam_schedules', ['class_id', 'section_id']);
  pgm.createIndex('exam_schedules', 'exam_date');
  pgm.createIndex('exam_schedules', 'is_published');
};

exports.down = (pgm) => {
  pgm.dropTable('exam_schedules');
};
