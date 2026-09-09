/**
 * patch-missing-tables.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates all tables that were added after the initial migration run.
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
 *
 * Run:  node scripts/patch-missing-tables.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = /* sql */ `

-- ─── pgcrypto (needed for gen_random_uuid) ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── grading_scales ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grading_scales (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(20)   NOT NULL,
  min_percentage  NUMERIC(5,2)  NOT NULL,
  max_percentage  NUMERIC(5,2)  NOT NULL,
  label           VARCHAR(50),
  is_pass         BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order      INTEGER       NOT NULL DEFAULT 0,
  created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_grading_scales_name UNIQUE (name),
  CONSTRAINT chk_grading_scales_range
    CHECK (min_percentage >= 0 AND max_percentage <= 100 AND max_percentage > min_percentage)
);
CREATE INDEX IF NOT EXISTS idx_grading_scales_min ON grading_scales (min_percentage);

-- seed only if empty
INSERT INTO grading_scales (name, min_percentage, max_percentage, label, is_pass, sort_order)
SELECT * FROM (VALUES
  ('A+',  90::NUMERIC, 100::NUMERIC, 'Excellent',     TRUE,  1),
  ('A',   80::NUMERIC,  89::NUMERIC, 'Very Good',     TRUE,  2),
  ('B+',  75::NUMERIC,  79::NUMERIC, 'Good',          TRUE,  3),
  ('B',   70::NUMERIC,  74::NUMERIC, 'Above Average', TRUE,  4),
  ('C+',  65::NUMERIC,  69::NUMERIC, 'Average',       TRUE,  5),
  ('C',   60::NUMERIC,  64::NUMERIC, 'Satisfactory',  TRUE,  6),
  ('D',   50::NUMERIC,  59::NUMERIC, 'Below Average', TRUE,  7),
  ('F',    0::NUMERIC,  49::NUMERIC, 'Fail',          FALSE, 8)
) AS v(name, min_percentage, max_percentage, label, is_pass, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM grading_scales LIMIT 1);

-- ─── school_profile ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS school_profile (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                       VARCHAR(200) NOT NULL,
  motto                      VARCHAR(255),
  logo_url                   TEXT,
  address                    TEXT,
  city                       VARCHAR(100),
  country                    VARCHAR(100) DEFAULT 'Kenya',
  phone                      VARCHAR(30),
  email                      VARCHAR(200),
  website                    VARCHAR(255),
  registration_number        VARCHAR(100),
  principal_name             VARCHAR(150),
  currency                   VARCHAR(5)   NOT NULL DEFAULT 'KES',
  academic_year_start_month  INTEGER      NOT NULL DEFAULT 1,
  terms_per_year             INTEGER      NOT NULL DEFAULT 3,
  created_at                 TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMP    NOT NULL DEFAULT NOW()
);
INSERT INTO school_profile (name, country, currency, terms_per_year)
SELECT 'EduFlow Private School', 'Kenya', 'KES', 3
WHERE NOT EXISTS (SELECT 1 FROM school_profile LIMIT 1);

-- ─── exam_schedules ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_schedules (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id               UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  academic_year_id      UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id              UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id            UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  curriculum_subject_id UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  title                 VARCHAR(200) NOT NULL,
  exam_date             DATE         NOT NULL,
  start_time            TIME,
  end_time              TIME,
  venue                 VARCHAR(150),
  notes                 TEXT,
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  created_by            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_exam_schedules_times
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_term    ON exam_schedules(term_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_year    ON exam_schedules(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_section ON exam_schedules(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_date    ON exam_schedules(exam_date);

-- ─── mark_components ─────────────────────────────────────────────────────────
-- Defines assessment components per exam schedule (Assignment=10, Quiz=10, Final=80...)
CREATE TABLE IF NOT EXISTS mark_components (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id  UUID NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,   -- e.g. "Assignment", "Mid Exam", "Final"
  max_marks         NUMERIC(6,2) NOT NULL,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mark_components_exam ON mark_components(exam_schedule_id);

-- ─── student_marks ───────────────────────────────────────────────────────────
-- Stores marks entered by the teacher per component per student
CREATE TABLE IF NOT EXISTS student_marks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mark_component_id    UUID NOT NULL REFERENCES mark_components(id) ON DELETE CASCADE,
  student_id           UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marks_obtained       NUMERIC(6,2),      -- NULL = not yet entered
  is_absent            BOOLEAN NOT NULL DEFAULT FALSE,
  teacher_remarks      TEXT,
  entered_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  entered_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_student_marks_component_student UNIQUE (mark_component_id, student_id),
  CONSTRAINT chk_student_marks_logic
    CHECK (is_absent = TRUE OR marks_obtained IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_student_marks_component ON student_marks(mark_component_id);
CREATE INDEX IF NOT EXISTS idx_student_marks_student   ON student_marks(student_id);

-- ─── report_cards ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id           UUID NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
  enrollment_id     UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
  total_marks       NUMERIC(8,2),
  total_percentage  NUMERIC(5,2),
  overall_grade     VARCHAR(10),
  class_rank        INTEGER,
  is_promoted       BOOLEAN,
  advisor_remarks   TEXT,
  principal_remarks TEXT,
  is_published      BOOLEAN NOT NULL DEFAULT FALSE,
  published_at      TIMESTAMP,
  generated_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_report_cards_student_term UNIQUE (student_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_report_cards_student ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_term    ON report_cards(term_id);

-- ─── report_card_items ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_card_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id        UUID NOT NULL REFERENCES report_cards(id) ON DELETE CASCADE,
  curriculum_subject_id UUID NOT NULL REFERENCES curriculum_subjects(id) ON DELETE RESTRICT,
  teacher_id            UUID REFERENCES teachers(id) ON DELETE SET NULL,
  total_marks           NUMERIC(6,2),
  percentage            NUMERIC(5,2),
  letter_grade          VARCHAR(5),
  is_passed             BOOLEAN,
  teacher_remarks       TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_report_card_items_card_subject UNIQUE (report_card_id, curriculum_subject_id)
);
CREATE INDEX IF NOT EXISTS idx_report_card_items_card ON report_card_items(report_card_id);

-- ─── fee_structures ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structures (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id         UUID REFERENCES classes(id) ON DELETE SET NULL,
  fee_type         VARCHAR(80)   NOT NULL,
  amount           NUMERIC(12,2) NOT NULL,
  currency         VARCHAR(5)    NOT NULL DEFAULT 'KES',
  due_date         DATE,
  description      TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fee_structures_amount CHECK (amount >= 0)
);
CREATE INDEX IF NOT EXISTS idx_fee_structures_year  ON fee_structures(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class ON fee_structures(class_id);

-- ─── fee_invoices ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  enrollment_id  UUID NOT NULL REFERENCES enrollments(id) ON DELETE RESTRICT,
  term_id        UUID NOT NULL REFERENCES terms(id) ON DELETE RESTRICT,
  invoice_number VARCHAR(60)   NOT NULL UNIQUE,
  total_amount   NUMERIC(12,2) NOT NULL,
  amount_paid    NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance        NUMERIC(12,2) NOT NULL,
  currency       VARCHAR(5)    NOT NULL DEFAULT 'KES',
  due_date       DATE,
  status         VARCHAR(20)   NOT NULL DEFAULT 'UNPAID',
  notes          TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fee_invoices_status
    CHECK (status IN ('UNPAID','PARTIAL','PAID','OVERDUE','WAIVED','CANCELLED')),
  CONSTRAINT chk_fee_invoices_amounts
    CHECK (total_amount >= 0 AND amount_paid >= 0)
);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_term    ON fee_invoices(term_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status  ON fee_invoices(status);

-- ─── fee_payments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_invoice_id        UUID NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  amount                NUMERIC(12,2) NOT NULL,
  payment_date          DATE NOT NULL,
  payment_method        VARCHAR(40) NOT NULL,
  transaction_reference VARCHAR(150),
  received_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fee_payments_method
    CHECK (payment_method IN ('CASH','MPESA','BANK_TRANSFER','CHEQUE','CARD','OTHER')),
  CONSTRAINT chk_fee_payments_amount CHECK (amount > 0)
);
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice ON fee_payments(fee_invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_date    ON fee_payments(payment_date);

ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS fee_type VARCHAR(100);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS due_date DATE;

-- ─── fee_structures — columns the service layer expects ──────────────────────
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS term_id       UUID REFERENCES terms(id) ON DELETE SET NULL;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS category      VARCHAR(100);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_mandatory  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS archived_at   TIMESTAMP;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS created_by    UUID REFERENCES users(id) ON DELETE SET NULL;
-- Back-fill category from fee_type where category is null
UPDATE fee_structures SET category = fee_type WHERE category IS NULL AND fee_type IS NOT NULL;

-- ─── fee_invoices — columns the service layer expects ────────────────────────
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE SET NULL;
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS gateway_status   VARCHAR(20);
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS tx_ref           VARCHAR(200);
ALTER TABLE fee_invoices ADD COLUMN IF NOT EXISTS checkout_url     TEXT;

-- ─── fee_payments — columns the service layer expects ────────────────────────
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS receipt_number   VARCHAR(60);
ALTER TABLE fee_payments ADD COLUMN IF NOT EXISTS recorded_by      UUID REFERENCES users(id) ON DELETE SET NULL;

-- ─── fix payment_method constraint to allow MOBILE_MONEY, GATEWAY, WAIVER ────
ALTER TABLE fee_payments DROP CONSTRAINT IF EXISTS chk_fee_payments_method;
ALTER TABLE fee_payments ADD CONSTRAINT chk_fee_payments_method
  CHECK (payment_method IN ('CASH','MPESA','BANK_TRANSFER','CHEQUE','CARD','OTHER','MOBILE_MONEY','GATEWAY','WAIVER'));

-- ─── indexes for new columns ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fee_structures_term    ON fee_structures(term_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_status  ON fee_structures(status);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_structure ON fee_invoices(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_txref     ON fee_invoices(tx_ref);
CREATE INDEX IF NOT EXISTS idx_fee_payments_receipt   ON fee_payments(receipt_number);


-- ─── Notification tables ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(60)  NOT NULL DEFAULT 'general',
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  link       TEXT,
  ref_type   VARCHAR(60),
  ref_id     UUID,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  read_at    TIMESTAMP,
  archived   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  email_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled          BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled         BOOLEAN NOT NULL DEFAULT TRUE,
  fee_alerts           BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_alerts    BOOLEAN NOT NULL DEFAULT TRUE,
  grade_alerts         BOOLEAN NOT NULL DEFAULT TRUE,
  announcement_alerts  BOOLEAN NOT NULL DEFAULT TRUE,
  new_message_alerts   BOOLEAN NOT NULL DEFAULT TRUE,
  results_alerts       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  channel           VARCHAR(20) NOT NULL,
  status            VARCHAR(20) NOT NULL,
  provider_response TEXT,
  error_message     TEXT,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_delivery_notif ON notification_delivery_log(notification_id);


CREATE TABLE IF NOT EXISTS announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255) NOT NULL,
  body        TEXT         NOT NULL,
  audience    VARCHAR(30)  NOT NULL DEFAULT 'ALL',
  class_id    UUID REFERENCES classes(id) ON DELETE SET NULL,
  priority    VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
  is_published BOOLEAN     NOT NULL DEFAULT TRUE,
  publish_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMP,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_announcements_audience
    CHECK (audience IN ('ALL','STUDENTS','PARENTS','TEACHERS','STAFF','CLASS')),
  CONSTRAINT chk_announcements_priority
    CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_audience   ON announcements(audience);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON announcements(publish_at);

-- ─── assignments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 VARCHAR(255) NOT NULL,
  description           TEXT,
  curriculum_subject_id UUID REFERENCES curriculum_subjects(id) ON DELETE SET NULL,
  class_id              UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id            UUID REFERENCES sections(id) ON DELETE SET NULL,
  teacher_id            UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  assignment_type       VARCHAR(20) NOT NULL DEFAULT 'individual',
  due_date              DATE NOT NULL,
  max_marks             NUMERIC(6,2) NOT NULL DEFAULT 100,
  instructions          TEXT,
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assignment_type CHECK (assignment_type IN ('individual','group'))
);
CREATE INDEX IF NOT EXISTS idx_assignments_class   ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due     ON assignments(due_date);

-- ─── assignment_groups ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  group_name    VARCHAR(150) NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assignment_groups_assignment ON assignment_groups(assignment_id);

-- ─── assignment_group_members ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES assignment_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_group_member UNIQUE (group_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_agm_group   ON assignment_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_agm_student ON assignment_group_members(student_id);

-- ─── assignment_submissions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  group_id      UUID REFERENCES assignment_groups(id) ON DELETE SET NULL,
  content       TEXT,
  file_url      TEXT,
  submitted_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  marks_obtained NUMERIC(6,2),
  feedback      TEXT,
  graded_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  graded_at     TIMESTAMP,
  status        VARCHAR(20) NOT NULL DEFAULT 'submitted',
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_submission_status CHECK (status IN ('submitted','graded','late','returned')),
  CONSTRAINT uq_submission_student_assignment UNIQUE (assignment_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON assignment_submissions(student_id);

-- ─── events ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  event_date   DATE NOT NULL,
  start_time   TIME,
  end_time     TIME,
  location     VARCHAR(255),
  audience     VARCHAR(30) NOT NULL DEFAULT 'ALL',
  class_id     UUID REFERENCES classes(id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_by   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_events_audience
    CHECK (audience IN ('ALL','STUDENTS','PARENTS','TEACHERS','STAFF','CLASS'))
);
CREATE INDEX IF NOT EXISTS idx_events_date     ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_audience ON events(audience);

-- ─── conversations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      VARCHAR(255),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── conversation_participants ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_conversation_participant UNIQUE (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);

-- ─── messages ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  read_at         TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);

`;

async function main() {
  const client = await pool.connect();
  try {
    console.log('\n🔧  Running patch — creating missing tables...\n');
    await client.query(SQL);
    console.log('✅  All missing tables created successfully!\n');
    console.log('   Tables created/verified:');
    console.log('   • grading_scales');
    console.log('   • school_profile');
    console.log('   • exam_schedules');
    console.log('   • mark_components');
    console.log('   • student_marks');
    console.log('   • report_cards + report_card_items');
    console.log('   • fee_structures + fee_invoices + fee_payments');
    console.log('   • announcements');
    console.log('   • notifications + notification_preferences + notification_delivery_log');
    console.log('   • assignments + assignment_groups + assignment_group_members + assignment_submissions');
    console.log('   • events');
    console.log('   • conversations + conversation_participants + messages\n');
  } catch (err) {
    console.error('❌  Patch failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
