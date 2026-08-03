/**
 * Migration: Create attendance_records table
 * Purpose: Stores the attendance status for every student within a session.
 *          History is never deleted.
 */

exports.up = (pgm) => {
  pgm.createTable('attendance_records', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    attendance_session_id: {
      type: 'UUID',
      notNull: true,
      references: '"attendance_sessions"',
      onDelete: 'CASCADE',
    },
    student_id: {
      type: 'UUID',
      notNull: true,
      references: '"students"',
      onDelete: 'CASCADE',
    },
    attendance_status: {
      type: 'VARCHAR(20)',
      notNull: true,
    },
    arrival_time: {
      type: 'TIME',
      notNull: false,
    },
    departure_time: {
      type: 'TIME',
      notNull: false,
    },
    reason: {
      type: 'TEXT',
      notNull: false,
    },
    remarks: {
      type: 'TEXT',
      notNull: false,
    },
    marked_by: {
      type: 'UUID',
      notNull: true,
      references: '"users"',
      onDelete: 'RESTRICT',
    },
    marked_at: {
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
    'attendance_records',
    'chk_attendance_records_status',
    "CHECK (attendance_status IN ('Present','Absent','Late','Excused','Sick','Permission','Holiday'))"
  );

  // A student cannot be marked twice in the same session
  pgm.addConstraint(
    'attendance_records',
    'uq_attendance_records_session_student',
    'UNIQUE (attendance_session_id, student_id)'
  );

  pgm.createIndex('attendance_records', 'attendance_session_id');
  pgm.createIndex('attendance_records', 'student_id');
  pgm.createIndex('attendance_records', 'attendance_status');
};

exports.down = (pgm) => {
  pgm.dropTable('attendance_records');
};
