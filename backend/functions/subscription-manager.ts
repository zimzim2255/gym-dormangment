
// ═══════════════════════════════════════════════════════════════════════════════
//  Subscription Manager - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  CRUD operations for subscriptions in Supabase database.
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const generateId = (prefix: string): string => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${rand}`;
  };

  try {
    const body = await req.json();

    switch (body.type) {
      case "create": {
        if (!body.subType || !body.subStart || !body.subEnd) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const memberId = body.memberId || `ADH${Date.now().toString(36).toUpperCase()}`;
        const subId = `AB${Date.now().toString(36).toUpperCase()}`;
        const price = body.price || 0;
        const paid = body.paid || 0;
        const remaining = Math.max(0, price - paid);
        const subStatus = remaining === 0 ? "Payé" : paid === 0 ? "Non payé" : "Paiement partiel";

        const { data: sub, error } = await supabase.from("subscriptions").insert({
          id: subId, member_id: memberId, sub_type: body.subType,
          sub_start: body.subStart, sub_end: body.subEnd,
          price, paid, remaining, sub_status: subStatus,
        }).select().single();

        if (error) throw error;

        // If paid amount > 0, add to caisse
        if (paid > 0) {
          await supabase.rpc("update_caisse", { amount_change: paid });
          await supabase.from("caisse_transactions").insert({
            type: "abonnement",
            label: `Abonnement ${subId} - ${body.subType} (${memberId})`,
            amount: paid,
            reference: subId,
            date: new Date().toLocaleDateString("fr-FR"),
          });
        }

        return new Response(JSON.stringify({ success: true, subscription: sub }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list": {
        // Get all subscriptions joined with member names
        const { data: subscriptions, error } = await supabase
          .from("subscriptions")
          .select(`*, members(name, phone)`)
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Flatten to match frontend format
        const flat = (subscriptions || []).map((s: any) => ({
          id: s.id,
          member: s.members?.name || s.member_id,
          phone: s.members?.phone || "",
          type: s.sub_type,
          start: s.sub_start,
          end: s.sub_end,
          price: s.price,
          paid: s.paid,
          remaining: s.remaining,
          status: s.sub_status,
          payment: "—",
          observation: "",
        }));

        return new Response(JSON.stringify({ subscriptions: flat }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update": {
        const { id, sub_type, sub_start, sub_end, price, paid } = body;
        const remaining = Math.max(0, (price || 0) - (paid || 0));
        const sub_status = remaining === 0 ? "Payé" : (paid || 0) === 0 ? "Non payé" : "Paiement partiel";

        const { data, error } = await supabase.from("subscriptions").update({
          sub_type, sub_start, sub_end, price, paid, remaining, sub_status,
        }).eq("id", id).select().single();

        if (error) throw error;
        return new Response(JSON.stringify({ success: true, subscription: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete": {
        const { error } = await supabase.from("subscriptions").delete().eq("id", body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});