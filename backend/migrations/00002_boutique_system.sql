-- ═══════════════════════════════════════════════════════════════════════════════
--  Boutique System - Database Migration
--  Relationships:
--  1. Achats → Stock (increases qty) + Fournisseur (increases solde) + Caisse (decreases)
--  2. Ventes → Stock (decreases qty) + Caisse (increases)
--  3. Abonnements → Caisse (increases)
--  4. Dépenses → Caisse (decreases)
--  5. Caisse tracks all money in/out
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Products (Stock) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cat VARCHAR(50),
  supplier VARCHAR(100),
  buy_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sell_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'En stock' CHECK (status IN ('En stock', 'Stock bas', 'Rupture')),
  photo VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ─── Suppliers (with balance tracking) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  city VARCHAR(50),
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,     -- What we OWE them
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, company)
);

-- ─── Sales (decreases stock, increases caisse) ───────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(50) PRIMARY KEY,
  date VARCHAR(10) NOT NULL,
  client VARCHAR(100),
  product VARCHAR(100),
  product_code VARCHAR(50),
  qty INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment VARCHAR(50) DEFAULT 'Espèces',
  emp VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date DESC);

-- ─── Purchases (increases stock, increases supplier balance, decreases caisse)
CREATE TABLE IF NOT EXISTS purchases (
  id VARCHAR(50) PRIMARY KEY,
  supplier_name VARCHAR(100),
  supplier_company VARCHAR(100),
  product VARCHAR(100),
  product_code VARCHAR(50),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  date VARCHAR(10) NOT NULL,
  payment VARCHAR(50) DEFAULT 'Espèces',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Caisse (Cash Register) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS caisse (
  id BIGSERIAL PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,       -- Current cash amount
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Caisse transactions log (history)
CREATE TABLE IF NOT EXISTS caisse_transactions (
  id BIGSERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('vente', 'abonnement', 'achat', 'depense', 'approvisionnement')),
  label VARCHAR(200) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,       -- Positive = in, Negative = out
  reference VARCHAR(100),                         -- Sale ID, Subscription ID, etc.
  date VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_caisse_transactions_date ON caisse_transactions(date DESC);

-- ─── Stock Movements History ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_code VARCHAR(50) NOT NULL REFERENCES products(code),
  product_name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('entree', 'sortie', 'ajustement')),
  reference_type VARCHAR(20) NOT NULL CHECK (reference_type IN ('achat', 'vente', 'manuel')),
  reference_id VARCHAR(100),
  qty_change INTEGER NOT NULL,                    -- Positive = in, Negative = out
  qty_after INTEGER NOT NULL,
  date VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_code);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date DESC);

-- ─── Staff ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  cin VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50),
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  hired VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'Présent' CHECK (status IN ('Présent', 'Absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Expenses (decreases caisse) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  cat VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  date VARCHAR(10) NOT NULL,
  resp VARCHAR(100),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- ─── Helper Functions ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_caisse(amount_change DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE caisse SET amount = amount + amount_change, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_supplier_balance(p_name VARCHAR, p_company VARCHAR, amount_change DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE suppliers SET balance = balance + amount_change WHERE name = p_name AND company = p_company;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_supplier_balance_by_name(p_name VARCHAR, amount_change DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE suppliers SET balance = balance + amount_change WHERE name = p_name;
END;
$$ LANGUAGE plpgsql;

-- ─── Seed Data ──────────────────────────────────────────────────────────────
INSERT INTO caisse (amount) VALUES (5000) ON CONFLICT DO NOTHING;

INSERT INTO products (code, name, cat, supplier, buy_price, sell_price, qty, min_stock, status) VALUES
  ('PRD001', 'Shaker Protein', 'Accessoires', 'FitSupply Maroc', 45, 80, 23, 10, 'En stock'),
  ('PRD002', 'Whey Protein 1kg', 'Nutrition', 'NutriFit Casablanca', 180, 290, 8, 15, 'Stock bas'),
  ('PRD003', 'Corde à sauter Pro', 'Équipement', 'SportGear MA', 30, 60, 15, 5, 'En stock'),
  ('PRD004', 'Gants de musculation', 'Accessoires', 'FitSupply Maroc', 55, 120, 2, 8, 'Rupture'),
  ('PRD005', 'Créatine Monohydrate 300g', 'Nutrition', 'NutriFit Casablanca', 90, 160, 11, 10, 'En stock'),
  ('PRD006', 'Bande élastique résistance', 'Équipement', 'SportGear MA', 25, 50, 3, 10, 'Rupture')
ON CONFLICT (code) DO NOTHING;

INSERT INTO suppliers (name, company, phone, email, city, balance) VALUES
  ('Anas Tahiri', 'FitSupply Maroc SARL', '0522 111 222', 'contact@fitsupply.ma', 'Casablanca', 0),
  ('Zineb Ouahbi', 'NutriFit SAS', '0522 333 444', 'info@nutrifit.ma', 'Casablanca', 1200),
  ('Rachid Filali', 'SportGear Maroc SARL', '0537 555 666', 'vente@sportgear.ma', 'Rabat', 500)
ON CONFLICT (name, company) DO NOTHING;

INSERT INTO staff (cin, name, phone, role, salary, hired, status) VALUES
  ('AA111111', 'Amine Belhaj', '0661 111 111', 'Coach Fitness', 4500, '01/03/2022', 'Présent'),
  ('BB222222', 'Imane Berrada', '0662 222 222', 'Réceptionniste', 3200, '15/06/2023', 'Présent'),
  ('CC333333', 'Khalid Hajji', '0663 333 333', 'Coach Cardio', 4200, '10/09/2021', 'Absent'),
  ('DD444444', 'Rim Amrani', '0664 444 444', 'Coach Yoga', 3800, '20/01/2023', 'Présent'),
  ('EE555555', 'Omar Kettani', '0665 555 555', 'Agent entretien', 2800, '05/11/2022', 'Présent')
ON CONFLICT (cin) DO NOTHING;