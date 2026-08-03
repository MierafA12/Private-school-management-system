/**
 * Migration: Create timetables table
 * Purpose: Stores the complete weekly school schedule.
 *          Replaces separate teacher_classes and teacher_subjects tables.
 *          Defines: who teaches, which class/section, which subject,
 *                   on what day, during which period, in which room.
 */

exports.up = (pgm) => {
  pgm.createTable('timetables', {
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
    term_id: {
      type: 'UUID',
      notNull: true,
      references: '"terms"',
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
    teacher_id: {
      type: 'UUID',
      notNull: true,
      references: '"teachers"',
      onDelete: 'RESTRICT',
    },
    day_of_week: {
      type: 'VARCHAR(15)',
      notNull: true,
    },
    period_number: {
      type: 'INTEGER',
      notNull: true,
    },
    start_time: {
      type: 'TIME',
      notNull: true,
    },
    end_time: {
      type: 'TIME',
      notNull: true,
    },
    room_number: {
      type: 'VARCHAR(30)',
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

  pgm.addConstraint(
    'timetables',
    'chk_timetables_day_of_week',
    "CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'))"
  );

  pgm.addConstraint(
    'timetables',
    'chk_timetables_times',
    'CHECK (end_time > start_time)'
  );

  // A class/section cannot have two subjects at the same period on the same day
  pgm.addConstraint(
    'timetables',
    'uq_timetables_section_period_day',
    'UNIQUE (term_id, section_id, day_of_week, period_number)'
  );

  // A teacher cannot be in two places at the same time
  pgm.addConstraint(
    'timetables',
    'uq_timetables_teacher_period_day',
    'UNIQUE (term_id, teacher_id, day_of_week, period_number)'
  );

  pgm.createIndex('timetables', 'academic_year_id');
  pgm.createIndex('timetables', 'term_id');
  pgm.createIndex('timetables', 'teacher_id');
  pgm.createIndex('timetables', ['class_id', 'section_id']);
};

exports.down = (pgm) => {
  pgm.dropTable('timetables');
};
