-- ═══════════════════════════════════════════════════════════════════════════════
--  SenseFace 3A/3B Door Control System - Database Migration
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Members (full profile) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  cin VARCHAR(20),
  gender VARCHAR(10) DEFAULT 'Homme',
  dob VARCHAR(10),          -- DD/MM/YYYY
  joined VARCHAR(10),       -- DD/MM/YYYY
  address TEXT,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  photo VARCHAR(500),       -- Cloudinary URL
  status VARCHAR(20) NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Suspendu')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- ─── Subscriptions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(50) PRIMARY KEY,
  member_id VARCHAR(50) NOT NULL REFERENCES members(id),
  sub_type VARCHAR(50) NOT NULL,
  sub_start VARCHAR(10) NOT NULL,  -- DD/MM/YYYY
  sub_end VARCHAR(10) NOT NULL,    -- DD/MM/YYYY
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  remaining DECIMAL(10,2) NOT NULL DEFAULT 0,
  sub_status VARCHAR(20) NOT NULL DEFAULT 'Non payé' CHECK (sub_status IN ('Payé', 'Paiement partiel', 'Non payé')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end ON subscriptions(sub_end);

-- ─── Terminals ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS door_terminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id VARCHAR(50) UNIQUE NOT NULL,
  model VARCHAR(20) NOT NULL CHECK (model IN ('SenseFace_3A', 'SenseFace_3B')),
  ip_address VARCHAR(45) NOT NULL,
  port INTEGER NOT NULL DEFAULT 4370,
  location VARCHAR(100) NOT NULL DEFAULT 'Main Entrance',
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_heartbeat TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Access Logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS access_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  member_id VARCHAR(50) NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  method VARCHAR(20) NOT NULL,
  device VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL DEFAULT CURRENT_TIME,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Autorisé', 'Expiré', 'Paiement restant', 'Refusé')),
  remaining DECIMAL(10,2) DEFAULT 0,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_access_logs_date ON access_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_member ON access_logs(member_id);

-- ─── Seed Data ──────────────────────────────────────────────────────────────
INSERT INTO door_terminals (terminal_id, model, ip_address, port, location, is_online) VALUES
  ('TERMINAL_001', 'SenseFace_3A', '192.168.1.100', 4370, 'Main Entrance', true),
  ('TERMINAL_002', 'SenseFace_3B', '192.168.1.101', 4370, 'Side Door', true),
  ('TERMINAL_003', 'SenseFace_3A', '192.168.1.102', 4370, 'Staff Entrance', false)
ON CONFLICT (terminal_id) DO NOTHING;

INSERT INTO members (id, name, phone, email, cin, gender, dob, joined, photo, status) VALUES
  ('ADH001', 'Karim Benali', '0661 234 567', 'karim.benali@gmail.com', 'AB123456', 'Homme', '15/03/1992', '10/01/2024', '', 'Actif'),
  ('ADH002', 'Fatima Zahra Alami', '0662 345 678', 'fz.alami@gmail.com', 'CD234567', 'Femme', '22/07/1998', '05/02/2024', '', 'Actif'),
  ('ADH003', 'Mohammed Idrissi', '0663 456 789', 'm.idrissi@outlook.com', 'EF345678', 'Homme', '08/11/1985', '20/11/2023', '', 'Suspendu'),
  ('ADH004', 'Sara Benkirane', '0664 567 890', 'sara.bk@gmail.com', 'GH456789', 'Femme', '30/05/2001', '15/03/2024', '', 'Actif'),
  ('ADH005', 'Youssef Tazi', '0665 678 901', 'y.tazi@gmail.com', 'IJ567890', 'Homme', '12/09/1995', '28/01/2024', '', 'Actif'),
  ('ADH006', 'Nadia Chraibi', '0666 789 012', 'nadia.c@yahoo.fr', 'KL678901', 'Femme', '03/04/1988', '10/12/2023', '', 'Actif'),
  ('ADH007', 'Hamid Ouazzani', '0667 890 123', 'hamid.o@gmail.com', 'MN789012', 'Homme', '17/08/1993', '02/04/2024', '', 'Actif'),
  ('ADH008', 'Laila Fassi', '0668 901 234', 'laila.f@gmail.com', 'OP890123', 'Femme', '25/12/2000', '18/02/2024', '', 'Suspendu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subscriptions (id, member_id, sub_type, sub_start, sub_end, price, paid, remaining, sub_status) VALUES
  ('AB001', 'ADH001', 'Mensuel', '01/07/2025', '31/07/2025', 200, 200, 0, 'Payé'),
  ('AB002', 'ADH002', 'Trimestriel', '01/06/2025', '31/08/2025', 500, 300, 200, 'Paiement partiel'),
  ('AB003', 'ADH004', 'Annuel', '15/01/2025', '15/01/2026', 1600, 1600, 0, 'Payé'),
  ('AB004', 'ADH005', 'Semestriel', '01/04/2025', '01/10/2025', 900, 0, 900, 'Non payé'),
  ('AB005', 'ADH006', 'Mensuel', '10/07/2025', '10/08/2025', 200, 200, 0, 'Payé'),
  ('AB006', 'ADH007', 'Mensuel', '05/07/2025', '05/08/2025', 200, 150, 50, 'Paiement partiel')
ON CONFLICT (id) DO NOTHING;