-- ============================================================
-- Parent Portal — Incremental Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- Run AFTER supabase_migration.sql
-- ============================================================

-- ============================================================
-- 1. EXAM_SCHEDULES (must exist before exam_results)
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_schedules (
  id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id        UUID         NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  term_id                 UUID         NOT NULL REFERENCES terms(id)          ON DELETE CASCADE,
  curriculum_subject_id   UUID         NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  class_id                UUID         NOT NULL REFERENCES classes(id)        ON DELETE CASCADE,
  section_id              UUID         NOT NULL REFERENCES sections(id)       ON DELETE CASCADE,
  title                   VARCHAR(200) NOT NULL,
  exam_type               VARCHAR(50)  DEFAULT 'WRITTEN' NOT NULL,
  exam_date               DATE         NOT NULL,
  start_time              TIME,
  end_time                TIME,
  venue                   VARCHAR(200),
  max_marks               DECIMAL(6,2) DEFAULT 100 NOT NULL,
  pass_marks              DECIMAL(6,2) DEFAULT 50,
  is_published            BOOLEAN      DEFAULT FALSE,
  created_by              UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_exam_schedules_type
    CHECK (exam_type IN ('WRITTEN','ORAL','PRACTICAL','ASSIGNMENT','CAT','MOCK','FINAL'))
);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_term_id        ON exam_schedules(term_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_class_section  ON exam_schedules(class_id, section_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_date      ON exam_schedules(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_subject_id     ON exam_schedules(curriculum_subject_id);

-- ============================================================
-- 2. EXAM_RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS exam_results (
  id                 UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_schedule_id   UUID          NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
  student_id         UUID          NOT NULL REFERENCES students(id)       ON DELETE CASCADE,
  marks_obtained     DECIMAL(6,2),
  is_absent          BOOLEAN       DEFAULT FALSE,
  remarks            TEXT,
  entered_by         UUID          REFERENCES users(id) ON DELETE SET NULL,
  entered_at         TIMESTAMP     DEFAULT NOW(),
  updated_at         TIMESTAMP     DEFAULT NOW(),
  CONSTRAINT uq_exam_results_exam_student UNIQUE (exam_schedule_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id       ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_schedule_id ON exam_results(exam_schedule_id);

-- ============================================================
-- 2. FEE_INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_invoices (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   VARCHAR(50)   UNIQUE NOT NULL,
  student_id       UUID          NOT NULL REFERENCES students(id)       ON DELETE CASCADE,
  term_id          UUID          NOT NULL REFERENCES terms(id)          ON DELETE RESTRICT,
  total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid      DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance          DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  currency         VARCHAR(10)   DEFAULT 'KES' NOT NULL,
  due_date         DATE,
  status           VARCHAR(20)   DEFAULT 'UNPAID' NOT NULL,
  notes            TEXT,
  created_by       UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_fee_invoices_status
    CHECK (status IN ('UNPAID','PARTIAL','PAID','OVERDUE','WAIVED','CANCELLED'))
);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_id ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_term_id    ON fee_invoices(term_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status     ON fee_invoices(status);

-- ============================================================
-- 3. FEE_PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS fee_payments (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_invoice_id        UUID          NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  amount                DECIMAL(12,2) NOT NULL,
  payment_date          DATE          NOT NULL DEFAULT CURRENT_DATE,
  payment_method        VARCHAR(50)   DEFAULT 'CASH' NOT NULL,
  transaction_reference VARCHAR(200),
  gateway_response      JSONB,
  receipt_number        VARCHAR(100),
  notes                 TEXT,
  recorded_by           UUID          REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_fee_payments_method
    CHECK (payment_method IN ('CASH','BANK_TRANSFER','MOBILE_MONEY','CARD','CHEQUE','GATEWAY','WAIVER'))
);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice_id ON fee_payments(fee_invoice_id);

-- ============================================================
-- 4. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS announcements (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  body         TEXT         NOT NULL,
  audience     VARCHAR(30)  DEFAULT 'ALL' NOT NULL,
  class_id     UUID         REFERENCES classes(id) ON DELETE SET NULL,
  priority     VARCHAR(20)  DEFAULT 'NORMAL' NOT NULL,
  is_published BOOLEAN      DEFAULT FALSE,
  publish_at   TIMESTAMP    DEFAULT NOW(),
  expires_at   TIMESTAMP,
  created_by   UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at   TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at   TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_announcements_audience
    CHECK (audience IN ('ALL','STUDENTS','PARENTS','TEACHERS','STAFF','CLASS')),
  CONSTRAINT chk_announcements_priority
    CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT'))
);
CREATE INDEX IF NOT EXISTS idx_announcements_audience   ON announcements(audience);
CREATE INDEX IF NOT EXISTS idx_announcements_publish_at ON announcements(publish_at);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id   ON announcements(class_id);

-- ============================================================
-- 5. EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  event_date    DATE         NOT NULL,
  start_time    TIME,
  end_time      TIME,
  location      VARCHAR(200),
  audience      VARCHAR(30)  DEFAULT 'ALL' NOT NULL,
  rsvp_required BOOLEAN      DEFAULT FALSE,
  rsvp_deadline DATE,
  capacity      INTEGER,
  is_published  BOOLEAN      DEFAULT FALSE,
  created_by    UUID         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TIMESTAMP    DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMP    DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_events_audience
    CHECK (audience IN ('ALL','STUDENTS','PARENTS','TEACHERS','STAFF'))
);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

-- ============================================================
-- 6. EVENT_RSVPS
-- ============================================================
CREATE TABLE IF NOT EXISTS event_rsvps (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID        NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  response   VARCHAR(20) DEFAULT 'ATTENDING' NOT NULL,
  notes      TEXT,
  created_at TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_event_rsvps_event_user UNIQUE (event_id, user_id),
  CONSTRAINT chk_event_rsvps_response
    CHECK (response IN ('ATTENDING','NOT_ATTENDING','MAYBE'))
);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id  ON event_rsvps(user_id);

-- ============================================================
-- 7. CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id   UUID      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  teacher_id  UUID      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  subject     VARCHAR(200),
  status      VARCHAR(20) DEFAULT 'OPEN' NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_conversations_status CHECK (status IN ('OPEN','CLOSED','ARCHIVED')),
  CONSTRAINT uq_conversations_parent_teacher_student UNIQUE (student_id, parent_id, teacher_id)
);
CREATE INDEX IF NOT EXISTS idx_conversations_parent_id  ON conversations(parent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_teacher_id ON conversations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON conversations(student_id);

-- ============================================================
-- 8. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID      NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID      NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  body            TEXT      NOT NULL,
  is_read         BOOLEAN   DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id       ON messages(sender_id);

-- ============================================================
-- 9. NOTIFICATION_PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID      UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN   DEFAULT TRUE,
  sms_enabled   BOOLEAN   DEFAULT FALSE,
  push_enabled  BOOLEAN   DEFAULT TRUE,
  fee_alerts    BOOLEAN   DEFAULT TRUE,
  attendance_alerts BOOLEAN DEFAULT TRUE,
  grade_alerts  BOOLEAN   DEFAULT TRUE,
  announcement_alerts BOOLEAN DEFAULT TRUE,
  updated_at    TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 10. REPORT_CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS report_cards (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID          NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  term_id          UUID          NOT NULL REFERENCES terms(id)     ON DELETE RESTRICT,
  total_marks      DECIMAL(8,2),
  total_percentage DECIMAL(5,2),
  overall_grade    VARCHAR(10),
  class_rank       INTEGER,
  advisor_remarks  TEXT,
  principal_remarks TEXT,
  is_published     BOOLEAN       DEFAULT FALSE,
  published_at     TIMESTAMP,
  created_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_report_cards_student_term UNIQUE (student_id, term_id)
);
CREATE INDEX IF NOT EXISTS idx_report_cards_student_id ON report_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_term_id    ON report_cards(term_id);

-- ============================================================
-- 11. REPORT_CARD_ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS report_card_items (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  report_card_id        UUID          NOT NULL REFERENCES report_cards(id)        ON DELETE CASCADE,
  curriculum_subject_id UUID          NOT NULL REFERENCES curriculum_subjects(id) ON DELETE RESTRICT,
  teacher_id            UUID          REFERENCES teachers(id) ON DELETE SET NULL,
  total_marks           DECIMAL(8,2),
  percentage            DECIMAL(5,2),
  letter_grade          VARCHAR(10),
  teacher_remarks       TEXT,
  is_passed             BOOLEAN       DEFAULT FALSE,
  created_at            TIMESTAMP     DEFAULT NOW() NOT NULL,
  CONSTRAINT uq_report_card_items_card_subject UNIQUE (report_card_id, curriculum_subject_id)
);
CREATE INDEX IF NOT EXISTS idx_report_card_items_report_card_id ON report_card_items(report_card_id);

-- ============================================================
-- Done. 11 new tables created.
-- ============================================================
