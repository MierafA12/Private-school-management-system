/**
 * Migration: Create permissions table
 * Purpose: Stores every action available in the system.
 */

exports.up = (pgm) => {
  pgm.createTable('permissions', {
    id: {
      type: 'UUID',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    module: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    action: {
      type: 'VARCHAR(50)',
      notNull: true,
    },
    code: {
      type: 'VARCHAR(100)',
      unique: true,
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
  });

  // Seed core permissions
  pgm.sql(`
    INSERT INTO permissions (module, action, code, description) VALUES
      -- User management
      ('User',       'Create',   'user.create',          'Create a new user account'),
      ('User',       'Read',     'user.read',             'View user accounts'),
      ('User',       'Update',   'user.update',           'Update user accounts'),
      ('User',       'Delete',   'user.delete',           'Delete user accounts'),

      -- Student
      ('Student',    'Create',   'student.create',        'Enroll a new student'),
      ('Student',    'Read',     'student.read',          'View student profiles'),
      ('Student',    'Update',   'student.update',        'Update student profiles'),
      ('Student',    'Delete',   'student.delete',        'Remove a student record'),

      -- Parent
      ('Parent',     'Create',   'parent.create',         'Add a parent/guardian'),
      ('Parent',     'Read',     'parent.read',           'View parent profiles'),
      ('Parent',     'Update',   'parent.update',         'Update parent profiles'),

      -- Teacher
      ('Teacher',    'Create',   'teacher.create',        'Add a teacher'),
      ('Teacher',    'Read',     'teacher.read',          'View teacher profiles'),
      ('Teacher',    'Update',   'teacher.update',        'Update teacher profiles'),

      -- Academics
      ('Academic',   'Manage',   'academic.manage',       'Manage academic years and terms'),
      ('Class',      'Manage',   'class.manage',          'Manage classes and sections'),
      ('Subject',    'Manage',   'subject.manage',        'Manage subjects and curriculum'),
      ('Timetable',  'Manage',   'timetable.manage',      'Manage timetables'),
      ('Enrollment', 'Manage',   'enrollment.manage',     'Manage student enrollments'),

      -- Attendance
      ('Attendance', 'Create',   'attendance.create',     'Take attendance'),
      ('Attendance', 'Read',     'attendance.read',       'View attendance records'),
      ('Attendance', 'Update',   'attendance.update',     'Edit attendance records'),
      ('Attendance', 'Report',   'attendance.report',     'Generate attendance reports'),

      -- Fees
      ('Fee',        'Create',   'fee.create',            'Create fee records'),
      ('Fee',        'Read',     'fee.read',              'View fee records'),
      ('Fee',        'Update',   'fee.update',            'Update fee records'),
      ('Fee',        'Report',   'fee.report',            'Generate fee reports');
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('permissions');
};
