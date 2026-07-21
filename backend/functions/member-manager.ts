// ═══════════════════════════════════════════════════════════════════════════════
//  Member Manager - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  CRUD operations for members in Supabase database.
//  Saves all member fields: photo, cin, gender, dob, email, address, etc.
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
      case "create": {
        const memberId = body.id || `ADH${Date.now().toString(36).toUpperCase()}`;
        const { data, error } = await supabase.from("members").insert({
          id: memberId,
          name: body.name || "",
          phone: body.phone || "",
          email: body.email || "",
          cin: body.cin || "",
          gender: body.gender || "Homme",
          dob: body.dob || "",
          joined: body.joined || new Date().toLocaleDateString("fr-FR"),
          address: body.address || "",
          emergency_contact: body.emergencyContact || "",
          emergency_phone: body.emergencyPhone || "",
          photo: body.photo || "",
          status: body.status || "Actif",
        }).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, member: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list": {
        const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify({ members: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update": {
        const { data, error } = await supabase.from("members").update({
          name: body.name,
          phone: body.phone,
          email: body.email,
          cin: body.cin,
          gender: body.gender,
          dob: body.dob,
          joined: body.joined,
          address: body.address,
          emergency_contact: body.emergencyContact,
          emergency_phone: body.emergencyPhone,
          photo: body.photo,
          status: body.status,
        }).eq("id", body.id).select().single();
        if (error) throw error;
        return new Response(JSON.stringify({ success: true, member: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete": {
        const { error } = await supabase.from("members").delete().eq("id", body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "subscription-history": {
        const { data } = await supabase.from("subscription_history")
          .select("*")
          .eq("member_id", body.member_id)
          .order("created_at", { ascending: false });
        return new Response(JSON.stringify({ history: data || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});