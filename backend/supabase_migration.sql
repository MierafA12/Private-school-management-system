-- ============================================================
-- Private School Management System
-- Full Database Migration for Supabase / PostgreSQL
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(50)  UNIQUE NOT NULL,
  description    TEXT,
  is_system_role BOOLEAN      DEFAULT TRUE,
  status         VARCHAR(20)  DEFAULT 'ACTIVE' NOT NULL,
  created_at     TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMP    DEFAULT NOW() NOT NULL
);

INSERT INTO roles (name, description, is_system_role, status) VALUES
  ('Super Admin', 'Full system access',                      TRUE, 'ACTIVE'),
  ('Principal',   'School principal with broad permissions', TRUE, 'ACTIVE'),
  ('Registrar',   'Manages student records and enrollment',  TRUE, 'ACTIVE'),
  ('Accountant',  'Manages fees and financial records',      TRUE, 'ACTIVE'),
  ('Teacher',     'Classroom teacher',                       TRUE, 'ACTIVE'),
  ('Student',     'Enrolled student',                        TRUE, 'ACTIVE'),
  ('Parent',      'Parent or guardian of a student',         TRUE, 'ACTIVE')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- 2. PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  module      VARCHAR(50)   NOT NULL,
  action      VARCHAR(50)   NOT NULL,
  code        VARCHAR(100)  UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMP     DEFAULT NOW() NOT NULL
);

INSERT INTO permissions (module, action, code, description) VALUES
  ('User',       'Create', 'user.create',        'Create a new user account'),
  ('User',       'Read',   'user.read',           'View user accounts'),
  ('User',       'Update', 'user.update',         'Update user accounts'),
  ('User',       'Delete', 'user.delete',         'Delete user accounts'),
  ('Student',    'Create', 'student.create',      'Enroll a new student'),
  ('Student',    'Read',   'student.read',        'View student profiles'),
  ('Student',    'Update', 'student.update',      'Update student profiles'),
  ('Student',    'Delete', 'student.delete',      'Remove a student record'),
  ('Parent',     'Create', 'parent.create',       'Add a parent/guardian'),
  ('Parent',     'Read',   'parent.read',         'View parent profiles'),
  ('Parent',     'Update', 'parent.update',       'Update parent profiles'),
  ('Teacher',    'Create', 'teacher.create',      'Add a teacher'),
  ('Teacher',    'Read',   'teacher.read',        'View teacher profiles'),
  ('Teacher',    'Update', 'teacher.update',      'Update teacher profiles'),
  ('Academic',   'Manage', 'academic.manage',     'Manage academic years and terms'),
  ('Class',      'Manage', 'class.manage',        'Manage classes and sections'),
  ('Subject',    'Manage', 'subject.manage',      'Manage subjects and curriculum'),
  ('Timetable',  'Manage', 'timetable.manage',    'Manage timetables'),
  ('Enrollment', 'Manage', 'enrollment.manage',   'Manage student enrollments'),
  ('Attendance', 'Create', 'attendance.create',   'Take attendance'),
  ('Attendance', 'Read',   'attendance.read',     'View attendance records'),
  ('Attendance', 'Update', 'attendance.update',   'Edit attendance records'),
  ('Attendance', 'Report', 'attendance.report',   'Generate attendance reports'),
  ('Fee',        'Create', 'fee.create',          'Create fee records'),
  ('Fee',        'Read',   'fee.read',            'View fee records'),
  ('Fee',        'Update', 'fee.update',          'Update fee records'),
  ('Fee',        'Report', 'fee.report',          'Generate fee reports')
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 3. ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       UUID      NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
  permission_id UUID      NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_role_permissions_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id       ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);


-- ============================================================
-- 4. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id                UUID         NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  email                  VARCHAR(255) UNIQUE,
  phone                  VARCHAR(20)  UNIQUE,
  password_hash          TEXT         NOT NULL,
  status                 VARCHAR(20)  DEFAULT 'ACTIVE' NOT NULL,
  email_verified         BOOLEAN      DEFAULT FALSE,
  phone_verified         BOOLEAN      DEFAULT FALSE,
  last_login             TIMESTAMP,
  failed_login_attempts  INTEGER      DEFAULT 0,
  password_changed_at    TIMESTAMP,
  created_at             TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at             TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_users_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE','INACTIVE','LOCKED','SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone   ON users(phone);


-- ============================================================
-- 5. STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_number          VARCHAR(50)  UNIQUE,
  admission_number        VARCHAR(50)  UNIQUE,
  first_name              VARCHAR(100) NOT NULL,
  middle_name             VARCHAR(100),
  last_name               VARCHAR(100) NOT NULL,
  gender                  VARCHAR(20)  NOT NULL,
  date_of_birth           DATE         NOT NULL,
  blood_group             VARCHAR(10),
  nationality             VARCHAR(100),
  religion                VARCHAR(100),
  profile_photo           TEXT,
  address                 TEXT         NOT NULL,
  emergency_contact_name  VARCHAR(150) NOT NULL,
  emergency_contact_phone VARCHAR(20)  NOT NULL,
  admission_date          DATE         NOT NULL,
  previous_school         VARCHAR(255),
  current_status          VARCHAR(30)  DEFAULT 'ACTIVE' NOT NULL,
  created_at              TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_students_gender CHECK (gender IN ('Male','Female','Other')),
  CONSTRAINT chk_students_status CHECK (current_status IN ('ACTIVE','INACTIVE','TRANSFERRED','GRADUATED','EXPELLED','SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_students_user_id        ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_number ON students(student_number);


-- ============================================================
-- 6. PARENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS parents (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name      VARCHAR(100) NOT NULL,
  middle_name     VARCHAR(100),
  last_name       VARCHAR(100) NOT NULL,
  gender          VARCHAR(20),
  relationship    VARCHAR(50)  NOT NULL,
  occupation      VARCHAR(150),
  employer        VARCHAR(150),
  national_id     VARCHAR(100),
  address         TEXT         NOT NULL,
  emergency_phone VARCHAR(20),
  profile_photo   TEXT,
  created_at      TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMP    DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);


-- ============================================================
-- 7. STUDENT_PARENTS  (M:N link)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_parents (
  id                 UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id         UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id          UUID      NOT NULL REFERENCES parents(id)  ON DELETE CASCADE,
  is_primary_contact BOOLEAN   DEFAULT FALSE,
  created_at         TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_student_parents_student_parent UNIQUE (student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_student_id ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent_id  ON student_parents(parent_id);


-- ============================================================
-- 8. TEACHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS teachers (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_number     VARCHAR(50)  UNIQUE,
  first_name          VARCHAR(100) NOT NULL,
  middle_name         VARCHAR(100),
  last_name           VARCHAR(100) NOT NULL,
  gender              VARCHAR(20)  NOT NULL,
  date_of_birth       DATE,
  qualification       VARCHAR(255) NOT NULL,
  specialization      VARCHAR(255),
  years_of_experience INTEGER      DEFAULT 0,
  phone_number        VARCHAR(20),
  address             TEXT,
  hire_date           DATE         NOT NULL,
  employment_status   VARCHAR(30)  DEFAULT 'ACTIVE' NOT NULL,
  profile_photo       TEXT,
  created_at          TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_teachers_employment_status
    CHECK (employment_status IN ('ACTIVE','INACTIVE','ON_LEAVE','TERMINATED','RETIRED'))
);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id         ON teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_teachers_employee_number ON teachers(employee_number);


-- ============================================================
-- 9. STAFF  (Principal, Registrar, Accountant, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID         UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_number   VARCHAR(50)  UNIQUE,
  first_name        VARCHAR(100) NOT NULL,
  middle_name       VARCHAR(100),
  last_name         VARCHAR(100) NOT NULL,
  gender            VARCHAR(20)  NOT NULL,
  date_of_birth     DATE,
  phone_number      VARCHAR(20),
  address           TEXT,
  department        VARCHAR(100),
  office_location   VARCHAR(100),
  hire_date         DATE         NOT NULL,
  employment_status VARCHAR(30)  DEFAULT 'ACTIVE' NOT NULL,
  profile_photo     TEXT,
  created_at        TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_staff_employment_status
    CHECK (employment_status IN ('ACTIVE','INACTIVE','ON_LEAVE','TERMINATED','RETIRED'))
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id         ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_number ON staff(employee_number);


-- ============================================================
-- 10. ACADEMIC_YEARS
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_years (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(50) UNIQUE NOT NULL,
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  is_current BOOLEAN     DEFAULT FALSE,
  status     VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
  created_at TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_academic_years_dates CHECK (end_date > start_date)
);

-- Only one academic year can be current at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_years_one_current
  ON academic_years (is_current)
  WHERE is_current = TRUE;


-- ============================================================
-- 11. TERMS
-- ============================================================
CREATE TABLE IF NOT EXISTS terms (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  name             VARCHAR(50) NOT NULL,
  start_date       DATE        NOT NULL,
  end_date         DATE        NOT NULL,
  status           VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
  created_at       TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_terms_dates CHECK (end_date > start_date),
  CONSTRAINT uq_terms_name_per_year UNIQUE (academic_year_id, name)
);

CREATE INDEX IF NOT EXISTS idx_terms_academic_year_id ON terms(academic_year_id);


-- ============================================================
-- 12. CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(50) UNIQUE NOT NULL,
  grade_level INTEGER     NOT NULL,
  description TEXT,
  created_at  TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP   DEFAULT NOW() NOT NULL
);


-- ============================================================
-- 13. SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID        NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name        VARCHAR(20) NOT NULL,
  room_number VARCHAR(30),
  capacity    INTEGER,
  created_at  TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_sections_name_per_class UNIQUE (class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sections_class_id ON sections(class_id);


-- ============================================================
-- 14. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(30)  UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP    DEFAULT NOW() NOT NULL
);


-- ============================================================
-- 15. CURRICULUM_SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS curriculum_subjects (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID           NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id         UUID           NOT NULL REFERENCES classes(id)        ON DELETE CASCADE,
  subject_id       UUID           NOT NULL REFERENCES subjects(id)       ON DELETE CASCADE,
  is_core          BOOLEAN        DEFAULT TRUE,
  weekly_periods   INTEGER        DEFAULT 5,
  pass_mark        DECIMAL(5,2)   DEFAULT 50,
  max_mark         DECIMAL(5,2)   DEFAULT 100,
  created_at       TIMESTAMP      DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP      DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_curriculum_subjects_year_class_subject
    UNIQUE (academic_year_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_curriculum_subjects_year_id    ON curriculum_subjects(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subjects_class_id   ON curriculum_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_subjects_subject_id ON curriculum_subjects(subject_id);


-- ============================================================
-- 16. CLASS_ADVISORS
-- ============================================================
CREATE TABLE IF NOT EXISTS class_advisors (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID      NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id         UUID      NOT NULL REFERENCES classes(id)        ON DELETE CASCADE,
  section_id       UUID      NOT NULL REFERENCES sections(id)       ON DELETE CASCADE,
  teacher_id       UUID      NOT NULL REFERENCES teachers(id)       ON DELETE RESTRICT,
  assigned_date    DATE      NOT NULL,
  created_at       TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_class_advisors_section_year UNIQUE (academic_year_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_class_advisors_year_class_section
  ON class_advisors(academic_year_id, class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_class_advisors_teacher_id ON class_advisors(teacher_id);


-- ============================================================
-- 17. ENROLLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id                           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                   UUID        NOT NULL REFERENCES students(id)       ON DELETE CASCADE,
  academic_year_id             UUID        NOT NULL REFERENCES academic_years(id) ON DELETE RESTRICT,
  class_id                     UUID        NOT NULL REFERENCES classes(id)        ON DELETE RESTRICT,
  section_id                   UUID        NOT NULL REFERENCES sections(id)       ON DELETE RESTRICT,
  roll_number                  VARCHAR(30),
  enrollment_date              DATE        NOT NULL,
  enrollment_status            VARCHAR(30) DEFAULT 'ACTIVE' NOT NULL,
  promoted_from_enrollment_id  UUID        REFERENCES enrollments(id) ON DELETE SET NULL,
  created_at                   TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at                   TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_enrollments_student_year UNIQUE (student_id, academic_year_id),
  CONSTRAINT chk_enrollments_status
    CHECK (enrollment_status IN ('ACTIVE','INACTIVE','TRANSFERRED','GRADUATED','REPEATED','WITHDRAWN'))
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id       ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year_id ON enrollments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_section    ON enrollments(class_id, section_id);


-- ============================================================
-- 18. TIMETABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS timetables (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id     UUID        NOT NULL REFERENCES academic_years(id)     ON DELETE CASCADE,
  term_id              UUID        NOT NULL REFERENCES terms(id)              ON DELETE CASCADE,
  class_id             UUID        NOT NULL REFERENCES classes(id)            ON DELETE CASCADE,
  section_id           UUID        NOT NULL REFERENCES sections(id)           ON DELETE CASCADE,
  curriculum_subject_id UUID       NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  teacher_id           UUID        NOT NULL REFERENCES teachers(id)           ON DELETE RESTRICT,
  day_of_week          VARCHAR(15) NOT NULL,
  period_number        INTEGER     NOT NULL,
  start_time           TIME        NOT NULL,
  end_time             TIME        NOT NULL,
  room_number          VARCHAR(30),
  created_at           TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_timetables_day_of_week
    CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  CONSTRAINT chk_timetables_times CHECK (end_time > start_time),
  -- One subject per class/section per period per day
  CONSTRAINT uq_timetables_section_period_day
    UNIQUE (term_id, section_id, day_of_week, period_number),
  -- A teacher cannot be in two places at once
  CONSTRAINT uq_timetables_teacher_period_day
    UNIQUE (term_id, teacher_id, day_of_week, period_number)
);

CREATE INDEX IF NOT EXISTS idx_timetables_academic_year_id ON timetables(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_timetables_term_id          ON timetables(term_id);
CREATE INDEX IF NOT EXISTS idx_timetables_teacher_id       ON timetables(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetables_class_section    ON timetables(class_id, section_id);


-- ============================================================
-- 19. ATTENDANCE_SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID        NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id          UUID        NOT NULL REFERENCES terms(id)          ON DELETE CASCADE,
  timetable_id     UUID        REFERENCES timetables(id)              ON DELETE SET NULL,
  class_id         UUID        NOT NULL REFERENCES classes(id)        ON DELETE CASCADE,
  section_id       UUID        NOT NULL REFERENCES sections(id)       ON DELETE CASCADE,
  teacher_id       UUID        NOT NULL REFERENCES teachers(id)       ON DELETE RESTRICT,
  attendance_date  DATE        NOT NULL,
  period_number    INTEGER,
  attendance_type  VARCHAR(30) DEFAULT 'DAILY' NOT NULL,
  remarks          TEXT,
  created_by       UUID        NOT NULL REFERENCES users(id)          ON DELETE RESTRICT,
  created_at       TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_attendance_sessions_type
    CHECK (attendance_type IN ('DAILY','PERIOD','EXAM','EVENT'))
);

-- One DAILY session per section per date
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_sessions_daily
  ON attendance_sessions (section_id, attendance_date)
  WHERE attendance_type = 'DAILY';

-- One PERIOD session per section per date per period
CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_sessions_period
  ON attendance_sessions (section_id, attendance_date, period_number)
  WHERE attendance_type = 'PERIOD' AND period_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_year_id   ON attendance_sessions(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_term_id   ON attendance_sessions(term_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date      ON attendance_sessions(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_sec ON attendance_sessions(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher   ON attendance_sessions(teacher_id);


-- ============================================================
-- 20. ATTENDANCE_RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_session_id UUID        NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id            UUID        NOT NULL REFERENCES students(id)            ON DELETE CASCADE,
  attendance_status     VARCHAR(20) NOT NULL,
  arrival_time          TIME,
  departure_time        TIME,
  reason                TEXT,
  remarks               TEXT,
  marked_by             UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  marked_at             TIMESTAMP   DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_attendance_records_status
    CHECK (attendance_status IN ('Present','Absent','Late','Excused','Sick','Permission','Holiday')),
  CONSTRAINT uq_attendance_records_session_student
    UNIQUE (attendance_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status     ON attendance_records(attendance_status);


-- ============================================================
-- Done. 20 tables created successfully.
-- ============================================================
