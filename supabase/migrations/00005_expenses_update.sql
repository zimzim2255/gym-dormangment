-- ═══════════════════════════════════════════════════════════════════════════════
--  Expenses Table Update - Add new columns for multi-type expense tracking
--  ───────────────────────────────────────────────────────────────────────────────
--  Adds columns for: expense_type, supplier_name, staff_name, staff_cin,
--  payment method, photo attachment, and cheque reference
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS expense_type VARCHAR(20) NOT NULL DEFAULT 'autre' CHECK (expense_type IN ('fournisseur', 'employe', 'autre')),
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS staff_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS staff_cin VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment VARCHAR(50) DEFAULT 'Espèces',
  ADD COLUMN IF NOT EXISTS photo VARCHAR(500),
  ADD COLUMN IF NOT EXISTS cheque_id VARCHAR(50);