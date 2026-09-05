-- ═══════════════════════════════════════════════════════════════════════════════
--  Subscription Audit - Add updated_by column to subscriptions table
--  ───────────────────────────────────────────────────────────────────────────────
--  Tracks which employee last created/updated each subscription
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);