-- ═══════════════════════════════════════════════════════════════════════════════
--  Reminder Logs - Tracks WhatsApp reminders sent via Twilio
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reminder_logs (
  id BIGSERIAL PRIMARY KEY,
  subscription_id VARCHAR(50),
  member_name VARCHAR(100),
  member_phone VARCHAR(20),
  message TEXT,
  sent BOOLEAN NOT NULL DEFAULT false,
  twilio_sid VARCHAR(100),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent ON reminder_logs(sent);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_created ON reminder_logs(created_at DESC);

-- Supabase cron schedule (run every day at 8:00 AM)
-- SELECT cron.schedule(
--   'subscription-reminder-daily',
--   '0 8 * * *',
--   'https://xquhrwwsgmtpycdzziyt.supabase.co/functions/v1/subscription-reminder'
-- );