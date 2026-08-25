// ═══════════════════════════════════════════════════════════════════════════════
//  SenseFace 3A Door Control - Supabase Client
//  ───────────────────────────────────────────────────────────────────────────────
//  Fetches real data from deployed Supabase edge functions
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zpxobitwvitkidcmhlyg.supabase.co";
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// ─── Get Access Logs ────────────────────────────────────────────────────────

export async function getAccessLogs(opts?: { dateFilter?: string; limit?: number; offset?: number }) {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/door-management`, {
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

// ─── Get Latest Scan (enriched: member photo + subscription + decision) ────

export async function getLatestScan() {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/door-management`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ""}`,
      },
      body: JSON.stringify({ type: "get-latest-scan" }),
    });
    if (res.ok) return await res.json();
    throw new Error("Failed to fetch latest scan");
  } catch {
    return { scan: null };
  }
}

// ─── Get Dashboard Stats ────────────────────────────────────────────────────

export async function getDoorStats() {
  try {
    const res = await fetch(`${FUNCTIONS_URL}/door-management`, {
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
    const res = await fetch(`${FUNCTIONS_URL}/door-management`, {
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