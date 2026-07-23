/**
 * Migration: Create attendance_sessions table
 * Purpose: Represents an attendance event for a class.
 *          A teacher first creates a session, then marks each student inside it.
 */

exports.up = (pgm) => {
  pgm.createTable('attendance_sessions', {
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
    // Nullable: DAILY sessions may not link to a specific timetable slot
    timetable_id: {
      type: 'UUID',
      notNull: false,
      references: '"timetables"',
      onDelete: 'SET NULL',
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
    attendance_date: {
      type: 'DATE',
      notNull: true,
    },
    period_number: {
      type: 'INTEGER',
      notNull: false,
    },
    attendance_type: {
      type: 'VARCHAR(30)',
      default: "'DAILY'",
      notNull: true,
    },
    remarks: {
      type: 'TEXT',
      notNull: false,
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
    'attendance_sessions',
    'chk_attendance_sessions_type',
    "CHECK (attendance_type IN ('DAILY', 'PERIOD', 'EXAM', 'EVENT'))"
  );

  // Prevent duplicate sessions for same class/section/period/date
  // For DAILY type (period_number IS NULL) we use a partial unique index
  pgm.sql(`
    CREATE UNIQUE INDEX uq_attendance_sessions_daily
      ON attendance_sessions (section_id, attendance_date)
      WHERE attendance_type = 'DAILY';
  `);

  pgm.sql(`
    CREATE UNIQUE INDEX uq_attendance_sessions_period
      ON attendance_sessions (section_id, attendance_date, period_number)
      WHERE attendance_type = 'PERIOD' AND period_number IS NOT NULL;
  `);

  pgm.createIndex('attendance_sessions', 'academic_year_id');
  pgm.createIndex('attendance_sessions', 'term_id');
  pgm.createIndex('attendance_sessions', 'attendance_date');
  pgm.createIndex('attendance_sessions', ['class_id', 'section_id']);
  pgm.createIndex('attendance_sessions', 'teacher_id');
};

exports.down = (pgm) => {
  pgm.dropTable('attendance_sessions');
};
