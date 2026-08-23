-- ═══════════════════════════════════════════════════════════════════════════════
--  Subscription Types (Tarifs des abonnements)
--  ───────────────────────────────────────────────────────────────────────────────
--  Global price catalogue for the 5 subscription types (JOUR/MENS/TRIM/SEMI/ANNU).
--  Read/written from Paramètres → Tarifs des abonnements.
--  Existing rows in `subscriptions` keep their historical prices (unchanged).
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscription_types (
  code VARCHAR(10) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  description VARCHAR(200) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Inactif')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default prices (same as the initial UI values)
INSERT INTO subscription_types (code, name, duration, price, description, status) VALUES
  ('JOUR', 'Journalier', '1 jour', 30, 'Accès unique journée', 'Actif'),
  ('MENS', 'Mensuel', '1 mois', 200, 'Accès illimité 1 mois', 'Actif'),
  ('TRIM', 'Trimestriel', '3 mois', 500, '3 mois économiques', 'Actif'),
  ('SEMI', 'Semestriel', '6 mois', 900, '6 mois à prix réduit', 'Actif'),
  ('ANNU', 'Annuel', '12 mois', 1600, 'Meilleure valeur', 'Actif')
ON CONFLICT (code) DO NOTHING;