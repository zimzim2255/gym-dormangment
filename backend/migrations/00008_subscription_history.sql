-- ═══════════════════════════════════════════════════════════════════════════════
--  Subscription History - Tracks all subscription renewals per member
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_history (
  id BIGSERIAL PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  subscription_id VARCHAR(50),
  sub_type VARCHAR(50) NOT NULL,
  sub_start VARCHAR(10) NOT NULL,
  sub_end VARCHAR(10) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
  sub_status VARCHAR(50) NOT NULL DEFAULT 'Non payé',
  payment_method VARCHAR(50) DEFAULT 'Espèces',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sub_history_member ON subscription_history(member_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_date ON subscription_history(created_at DESC);

-- Trigger function: auto-archive subscription when created/updated
CREATE OR REPLACE FUNCTION archive_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscription_history (
    member_id, subscription_id, sub_type, sub_start, sub_end,
    price, paid, remaining, sub_status
  ) VALUES (
    NEW.member_id, NEW.id, NEW.sub_type, NEW.sub_start, NEW.sub_end,
    NEW.price, NEW.paid, NEW.remaining, NEW.sub_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on subscriptions table
DROP TRIGGER IF EXISTS trg_archive_subscription ON subscriptions;
CREATE TRIGGER trg_archive_subscription
  AFTER INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION archive_subscription();