-- ═══════════════════════════════════════════════════════════════════════════════
--  Access Sessions - table the webhook writes to (plus access_logs columns)
--  ───────────────────────────────────────────────────────────────────────────────
--  The zkteco-webhook inserts into access_sessions (decision audit) and writes
--  subscription_type into access_logs. These were created by a manual SQL fix on
--  the old project; port them into formal migrations for the new gym.
--  Fully idempotent (IF NOT EXISTS) - safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════════════

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

ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50);
ALTER TABLE access_logs ADD COLUMN IF NOT EXISTS remaining DECIMAL(10,2) DEFAULT 0;