// ═══════════════════════════════════════════════════════════════════════════════
//  SenseFace 3A/3B Door Management - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Handles: terminal heartbeat, access logs, dashboard stats, terminal registration
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();

    switch (body.type) {
      case "terminal-heartbeat": {
        if (!body.terminalId) throw new Error("Missing terminalId");
        const { data, error } = await supabase
          .from("door_terminals")
          .update({ is_online: true, last_heartbeat: new Date().toISOString() })
          .eq("terminal_id", body.terminalId)
          .select()
          .single();
        if (error?.code === "PGRST116") {
          const { data: t } = await supabase.from("door_terminals").insert({
            terminal_id: body.terminalId, model: body.model || "SenseFace_3A",
            ip_address: body.ipAddress || "0.0.0.0", location: body.location || "Unregistered",
            is_online: true, last_heartbeat: new Date().toISOString(),
          }).select().single();
          return new Response(JSON.stringify({ status: "registered", terminal: t }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ status: "ok", terminal: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get-logs": {
        let query = supabase.from("access_logs").select("*").order("logged_at", { ascending: false }).limit(body.limit || 50);
        if (body.dateFilter) query = query.eq("date", body.dateFilter);
        if (body.offset) query = query.range(body.offset, body.offset + (body.limit || 50) - 1);
        const { data: logs } = await query;
        return new Response(JSON.stringify({ logs, count: logs?.length || 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get-stats": {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const [total, authorized, denied, pending, terminals] = await Promise.all([
          supabase.from("access_logs").select("*", { count: "exact", head: true }).eq("date", today),
          supabase.from("access_logs").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "Autorisé"),
          supabase.from("access_logs").select("*", { count: "exact", head: true }).eq("date", today).in("status", ["Expiré", "Refusé"]),
          supabase.from("access_logs").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "Paiement restant"),
          supabase.from("door_terminals").select("*", { count: "exact", head: true }).eq("is_online", true),
        ]);
        return new Response(JSON.stringify({
          stats: { totalToday: total.count || 0, authorizedToday: authorized.count || 0, deniedToday: denied.count || 0, pendingPaymentsToday: pending.count || 0, activeTerminals: terminals.count || 0 }
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get-terminals": {
        const { data: terminals } = await supabase.from("door_terminals").select("*").order("created_at", { ascending: true });
        return new Response(JSON.stringify({ terminals }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "register-terminal": {
        const { data } = await supabase.from("door_terminals").insert({
          terminal_id: body.terminalId, model: body.model || "SenseFace_3A",
          ip_address: body.ipAddress || "0.0.0.0", location: body.location || "New Terminal",
          is_online: false, last_heartbeat: null,
        }).select().single();
        return new Response(JSON.stringify({ terminal: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});