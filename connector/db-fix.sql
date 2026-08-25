-- ═══════════════════════════════════════════════════════════════════════════════
--  Migração: Access Logs / Sessions - apply once
--  ───────────────────────────────────────────────────────────────────────────────
--  Fixes two schema gaps that made the webhook's writes silently fail:
--    1. access_sessions table was missing entirely  -> create it
--    2. access_logs lacked the subscription_type column -> add it
--
--  This is fully idempotent: safe to run more than once (uses IF NOT EXISTS).
--  Run it in SUPABASE: SQL Editor → paste → Run.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Recreate the sessions table the webhook inserts into.
CREATE TABLE IF NOT EXISTS access_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  member_id VARCHAR(50),
  device_id VARCHAR(50),
  method VARCHAR(20),
  status VARCHAR(20),
  decision VARCHAR(30),
  decision_message TEXT,
  remaining_amount NUMERIC(10,2) DEFAULT 0,
  execution_time_ms INTEGER DEFAULT 0,
  confidence NUMERIC(7,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_sessions_member ON access_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_access_sessions_created ON access_sessions(created_at DESC);

-- 2) Add the subscription_type column the webhook expects.
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50);

-- 3) Make sure the FK-friendly columns exist (safe).
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS remaining DECIMAL(10,2) DEFAULT 0;

-- 4) Optional: force the seed rows to match known test users.
UPDATE access_logs SET member_name = COALESCE(NULLIF(member_name,''), member_id)
  WHERE member_name IS NULL OR member_name = '';