-- ═══════════════════════════════════════════════════════════════════════════════
--  Product Audit - Add updated_by column to products table
--  ───────────────────────────────────────────────────────────────────────────────
--  Tracks which employee last created/updated each product
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);