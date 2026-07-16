// ═══════════════════════════════════════════════════════════════════════════════
//  Subscription Manager - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Creates and manages member subscriptions in Supabase database.
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

interface SubscriptionInput {
  type: "create" | "get-member" | "list";
  memberId?: string;
  subType?: string;
  subStart?: string;
  subEnd?: string;
  price?: number;
  paid?: number;
  memberName?: string;
  memberPhone?: string;
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const generateId = (prefix: string): string => {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${rand}`;
  };

  try {
    const body: SubscriptionInput = await req.json();

    switch (body.type) {
      case "create": {
        if (!body.memberName || !body.subType || !body.subStart || !body.subEnd) {
          return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
        }

        const memberId = body.memberId || generateId("ADH");
        const subId = generateId("AB");

        // Upsert: create member if new, or use existing
        const { data: member } = await supabase
          .from("members")
          .select("id, name")
          .eq("id", memberId)
          .single();

        if (!member) {
          await supabase.from("members").insert({
            id: memberId,
            name: body.memberName,
            phone: body.memberPhone || "",
            status: "Actif",
          });
        }

        // Create subscription
        const price = body.price || 0;
        const paid = body.paid || 0;
        const remaining = Math.max(0, price - paid);
        const subStatus = remaining === 0 ? "Payé" : paid === 0 ? "Non payé" : "Paiement partiel";

        const { data: sub, error } = await supabase
          .from("subscriptions")
          .insert({
            id: subId,
            member_id: memberId,
            sub_type: body.subType,
            sub_start: body.subStart,
            sub_end: body.subEnd,
            price,
            paid,
            remaining,
            sub_status: subStatus,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          memberId,
          subscription: sub,
        }), { headers: { "Content-Type": "application/json" } });
      }

      case "get-member": {
        if (!body.memberId) {
          return new Response(JSON.stringify({ error: "Missing memberId" }), { status: 400 });
        }

        const { data: member } = await supabase
          .from("members")
          .select("*")
          .eq("id", body.memberId)
          .single();

        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("member_id", body.memberId)
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ member, subscriptions }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      case "list": {
        // Get all members with their latest subscription
        const { data: members } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });

        return new Response(JSON.stringify({ members }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});