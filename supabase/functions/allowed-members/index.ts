// ═══════════════════════════════════════════════════════════════════════════════
//  allowed-members - returns the members allowed to enter RIGHT NOW.
//  ───────────────────────────────────────────────────────────────────────────────
//  Used by the connector's access-sync layer: the connector asks "who may
//  enter?" and writes that state into the CVAccess local DB so the terminal
//  refuses the rest LOCALLY (relay never fires for them).
//  Rule mirrors zkteco-webhook: member Actif + subscription in range + paid
//  (Payé / Paiement partiel allowed, "Non payé" denied). Uses each member's
//  latest subscription (by sub_end).
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Compare two DD/MM/YYYY strings chronologically.
function cmpFrDate(a: string, b: string): number {
  const p = (s: string) => {
    const [d, m, y] = s.split("/").map(Number);
    return y * 10000 + m * 100 + d;
  };
  const av = a ? p(a) : 0;
  const bv = b ? p(b) : 0;
  return av === bv ? 0 : av > bv ? 1 : -1;
}

function parseFrDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const secret =
    Deno.env.get("ZKTECO_WEBHOOK_SECRET") ||
    Deno.env.get("WEBHOOK_SECRET") ||
    Deno.env.get("GYM_DOOR_SECRET");
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  try {
    const { data: members } = await supabase.from("members").select("id, status");
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("member_id, sub_start, sub_end, sub_status");

    const memberStatus = new Map<string, string>();
    for (const m of members || []) memberStatus.set(m.id, m.status);

    // latest subscription per member (by sub_end desc)
    const latestSub = new Map<string, any>();
    for (const s of subs || []) {
      const cur = latestSub.get(s.member_id);
      if (!cur || cmpFrDate(s.sub_end, cur.sub_end) > 0) latestSub.set(s.member_id, s);
    }

    const today = new Date();
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const allowed: Array<{ userId: string; subEnd: string }> = [];
    for (const [memberId, sub] of latestSub) {
      if (memberStatus.get(memberId) !== "Actif") continue;
      if (sub.sub_status === "Non payé") continue;
      const startDate = parseFrDate(sub.sub_start);
      const endDate = parseFrDate(sub.sub_end);
      if (!startDate || !endDate) continue;
      if (todayNorm < startDate || todayNorm > endDate) continue;
      allowed.push({ userId: memberId, subEnd: sub.sub_end });
    }

    return new Response(JSON.stringify({ allowed, count: allowed.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("allowed-members error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});