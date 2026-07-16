// ═══════════════════════════════════════════════════════════════════════════════
//  SenseFace 3A Door Control - Supabase Client
//  ───────────────────────────────────────────────────────────────────────────────
//  Minimal frontend service. The real work happens in the edge function.
//  This only fetches logs/stats for the dashboard.
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://localhost:54321";
const DOOR_MGMT_URL = `${SUPABASE_URL}/functions/v1/door`;

// ─── Get Access Logs ────────────────────────────────────────────────────────

export async function getAccessLogs(opts?: { dateFilter?: string; limit?: number }) {
  try {
    const res = await fetch(DOOR_MGMT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
      },
      body: JSON.stringify({ type: "get-logs", ...opts }),
    });
    if (res.ok) return await res.json();
    throw new Error("Failed to fetch logs");
  } catch {
    return { logs: [], count: 0 };
  }
}

// ─── Get Dashboard Stats ────────────────────────────────────────────────────

export async function getDoorStats() {
  try {
    const res = await fetch(DOOR_MGMT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
      },
      body: JSON.stringify({ type: "get-stats" }),
    });
    if (res.ok) return await res.json();
    throw new Error("Failed to fetch stats");
  } catch {
    return { stats: { totalToday: 0, authorizedToday: 0, deniedToday: 0, pendingPaymentsToday: 0, activeTerminals: 0 } };
  }
}

// ─── Get Terminals ──────────────────────────────────────────────────────────

export async function getTerminals() {
  try {
    const res = await fetch(DOOR_MGMT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
      },
      body: JSON.stringify({ type: "get-terminals" }),
    });
    if (res.ok) return await res.json();
    throw new Error("Failed to fetch terminals");
  } catch {
    return { terminals: [] };
  }
}