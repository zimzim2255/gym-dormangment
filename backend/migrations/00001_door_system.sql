-- ═══════════════════════════════════════════════════════════════════════════════
--  SenseFace 3A/3B Door Control System - Database Migration
--  ───────────────────────────────────────────────────────────────────────────────
--  Tables: door_terminals, access_sessions, access_logs, offline_queue
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS door_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(20) NOT NULL CHECK (model IN ('SenseFace_3A', 'SenseFace_3B')),
  ip_address VARCHAR(45) NOT NULL,
  port INTEGER NOT NULL DEFAULT 4370,
  protocol VARCHAR(20) NOT NULL DEFAULT 'PUSH' CHECK (protocol IN ('REST', 'WEBSOCKET', 'PUSH', 'BEST')),
  firmware_version VARCHAR(20) DEFAULT '1.0.0',
  location VARCHAR(100) NOT NULL DEFAULT 'Main Entrance',
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_heartbeat TIMESTAMPTZ,
  wifi_enabled BOOLEAN NOT NULL DEFAULT false,
  rs485_enabled BOOLEAN NOT NULL DEFAULT true,
  wiegand_mode VARCHAR(20) NOT NULL DEFAULT 'disabled' CHECK (wiegand_mode IN ('input', 'output', 'disabled')),
  sip_enabled BOOLEAN NOT NULL DEFAULT true,
  onvif_enabled BOOLEAN NOT NULL DEFAULT true,
  auth_methods TEXT[] NOT NULL DEFAULT ARRAY['face', 'rfid', 'password']::TEXT[],
  api_key VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('fingerprint', 'face', 'qr', 'rfid', 'password')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'error', 'expired')),
  decision VARCHAR(20) CHECK (decision IN ('GRANTED', 'DENIED', 'PENDING_PAYMENT', 'ERROR')),
  decision_message TEXT,
  remaining_amount DECIMAL(10,2) DEFAULT 0,
  execution_time_ms INTEGER,
  retry_count INTEGER NOT NULL DEFAULT 0,
  confidence DECIMAL(5,2),
  biometric_data BYTEA,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL REFERENCES access_sessions(session_id),
  member_id VARCHAR(50) NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  subscription_type VARCHAR(50),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Autorisé', 'Expiré', 'Paiement restant', 'Refusé')),
  remaining DECIMAL(10,2) DEFAULT 0,
  device VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL,
  device_id VARCHAR(50),
  confidence DECIMAL(5,2),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offline_queue (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  member_id VARCHAR(50) NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  method VARCHAR(20) NOT NULL,
  access_time TIMESTAMPTZ NOT NULL,
  biometric_data BYTEA,
  qr_code TEXT,
  rfid_card VARCHAR(50),
  synced BOOLEAN NOT NULL DEFAULT false,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_member ON access_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_access_sessions_member ON access_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_access_sessions_status ON access_sessions(status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_synced ON offline_queue(synced) WHERE synced = false;
CREATE INDEX IF NOT EXISTS idx_door_terminals_online ON door_terminals(is_online) WHERE is_online = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_door_terminals_updated_at
  BEFORE UPDATE ON door_terminals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

INSERT INTO door_terminals (terminal_id, model, ip_address, port, location, is_online, auth_methods)
VALUES 
  ('TERMINAL_001', 'SenseFace_3A', '192.168.1.100', 4370, 'Main Entrance', true, ARRAY['fingerprint', 'face', 'rfid', 'password']::TEXT[]),
  ('TERMINAL_002', 'SenseFace_3B', '192.168.1.101', 4370, 'Side Door', true, ARRAY['face', 'rfid', 'password']::TEXT[]),
  ('TERMINAL_003', 'SenseFace_3A', '192.168.1.102', 4370, 'Staff Entrance', false, ARRAY['fingerprint', 'face', 'rfid', 'password']::TEXT[])
ON CONFLICT (terminal_id) DO NOTHING;