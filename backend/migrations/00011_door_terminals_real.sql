-- ═══════════════════════════════════════════════════════════════════════════════
--  Door Terminals - Point at the REAL hardware (new gym, 2 doors)
--  ───────────────────────────────────────────────────────────────────────────────
--  Replaces the demo TERMINAL_001/002/003 rows with the two physical
--  SpeedFace-V3L devices used in the new gym:
--    Entrée (entrance)  TDBD260600972  @ 192.168.1.18
--    Sortie (exit)      TDBD260600996  @ 192.168.1.16
--  The model CHECK is relaxed to accept SpeedFace_V3L.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1) Allow the real device model
ALTER TABLE door_terminals DROP CONSTRAINT IF EXISTS door_terminals_model_check;
ALTER TABLE door_terminals ADD CONSTRAINT door_terminals_model_check
  CHECK (model IN ('SenseFace_3A', 'SenseFace_3B', 'SpeedFace_V3L'));

-- 2) Remove the old demo terminals
DELETE FROM door_terminals WHERE terminal_id IN ('TERMINAL_001', 'TERMINAL_002', 'TERMINAL_003');

-- 3) Upsert the two real doors (idempotent - safe to re-run)
INSERT INTO door_terminals (terminal_id, model, ip_address, port, location, is_online, last_heartbeat)
VALUES
  ('TDBD260600972', 'SpeedFace_V3L', '192.168.1.18', 4370, 'Entrée', true, NOW()),
  ('TDBD260600996', 'SpeedFace_V3L', '192.168.1.16', 4370, 'Sortie', true, NOW())
ON CONFLICT (terminal_id) DO UPDATE SET
  model = EXCLUDED.model,
  ip_address = EXCLUDED.ip_address,
  location = EXCLUDED.location,
  is_online = EXCLUDED.is_online,
  last_heartbeat = EXCLUDED.last_heartbeat;