-- ═══════════════════════════════════════════════════════════════════════════════
--  Staff Attendance System
--  ───────────────────────────────────────────────────────────────────────────────
--  Tracks daily presence/absence for each staff member with history
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Staff Attendance Table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_attendance (
  id BIGSERIAL PRIMARY KEY,
  staff_cin VARCHAR(20) NOT NULL REFERENCES staff(cin) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Présent' CHECK (status IN ('Présent', 'Absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(staff_cin, date)
);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff ON staff_attendance(staff_cin);