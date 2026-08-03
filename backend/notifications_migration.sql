-- ============================================================
-- Notifications System — Migration
-- Run AFTER parent_portal_migration.sql
-- notification_preferences table already exists — skipped here
-- ============================================================

-- ============================================================
-- 1. NOTIFICATIONS  (in-app notification center feed)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(60) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT        NOT NULL,
  link        TEXT,
  ref_type    VARCHAR(60),
  ref_id      UUID,
  is_read     BOOLEAN     DEFAULT FALSE,
  read_at     TIMESTAMP,
  archived    BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_notifications_type CHECK (type IN (
    'attendance_alert','fee_reminder','payment_confirmation',
    'results_published','report_card_published','announcement',
    'new_message','system','general'
  ))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type       ON notifications(type);

-- ============================================================
-- 2. NOTIFICATION_DELIVERY_LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID        REFERENCES notifications(id) ON DELETE SET NULL,
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel           VARCHAR(20) NOT NULL,
  status            VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
  provider_response JSONB,
  error_message     TEXT,
  attempted_at      TIMESTAMP   DEFAULT NOW() NOT NULL,
  CONSTRAINT chk_ndl_channel CHECK (channel IN ('in_app','email','sms','push')),
  CONSTRAINT chk_ndl_status  CHECK (status  IN ('PENDING','SENT','FAILED','SKIPPED'))
);
CREATE INDEX IF NOT EXISTS idx_ndl_notification_id ON notification_delivery_log(notification_id);
CREATE INDEX IF NOT EXISTS idx_ndl_user_id         ON notification_delivery_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ndl_status          ON notification_delivery_log(status);

-- ============================================================
-- Extend notification_preferences with per-type columns
-- (table already created in parent_portal_migration.sql)
-- ============================================================
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS new_message_alerts  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS results_alerts       BOOLEAN DEFAULT TRUE;

-- ============================================================
-- Done. 2 new tables + 2 columns on notification_preferences.
-- ============================================================
