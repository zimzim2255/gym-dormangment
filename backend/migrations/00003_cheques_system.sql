-- ═══════════════════════════════════════════════════════════════════════════════
--  Chèques Management System - Database Migration
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cheques (
  id BIGSERIAL PRIMARY KEY,
  cheque_id VARCHAR(50) UNIQUE NOT NULL,           -- Cheque number from bank
  member_id VARCHAR(50) REFERENCES members(id),    -- Client from members table
  member_name VARCHAR(100) NOT NULL,               -- Client name (denormalized)
  giver VARCHAR(100) NOT NULL,                     -- Person who gave the cheque
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,         -- Total cheque amount
  used_amount DECIMAL(10,2) NOT NULL DEFAULT 0,    -- Amount already used
  remaining DECIMAL(10,2) NOT NULL DEFAULT 0,      -- Remaining amount
  usage_percent INTEGER NOT NULL DEFAULT 100,      -- 30, 50, 70, 100
  date_emission VARCHAR(10) NOT NULL,              -- Date issued
  date_echeance VARCHAR(10) NOT NULL,              -- Due date
  date_execution VARCHAR(10),                      -- Execution date (when cashed)
  photo VARCHAR(500),                              -- Cloudinary URL of cheque photo
  status VARCHAR(20) NOT NULL DEFAULT 'En_attente' CHECK (status IN ('En_attente', 'Encaissé', 'Partiel', 'Rejeté')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cheques_status ON cheques(status);
CREATE INDEX IF NOT EXISTS idx_cheques_member ON cheques(member_id);
CREATE INDEX IF NOT EXISTS idx_cheques_date_echeance ON cheques(date_echeance);