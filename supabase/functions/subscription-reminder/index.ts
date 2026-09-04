// ═══════════════════════════════════════════════════════════════════════════════
//  Subscription Reminder - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Checks for subscriptions expiring in 3 days and sends WhatsApp reminders
//  via Twilio. Can be triggered via cron (every day at 8:00 AM).
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

  try {
    // Calculate date 3 days from now in dd/mm/yyyy format
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 3);
    const targetDateStr = targetDate.toLocaleDateString("fr-FR");

    console.log(`Checking for subscriptions expiring on: ${targetDateStr}`);

    // Find subscriptions ending in 3 days that are NOT fully paid
    const { data: expiringSubs, error } = await supabase
      .from("subscriptions")
      .select(`*, members!inner(name, phone)`)
      .eq("sub_end", targetDateStr)
      .neq("sub_status", "Payé");

    if (error) throw error;

    if (!expiringSubs || expiringSubs.length === 0) {
      return new Response(JSON.stringify({ message: "No expiring subscriptions found", checked: targetDateStr }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${expiringSubs.length} expiring subscription(s)`);

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
    const twilioFrom = Deno.env.get("TWILIO_WHATSAPP_FROM") || "+14155238886";
    const results: any[] = [];

    for (const sub of expiringSubs) {
      const memberName = sub.members?.name || "Membre";
      const memberPhone = sub.members?.phone || "";
      const subId = sub.id;
      const subType = sub.sub_type || "abonnement";
      const remaining = sub.remaining || sub.price || 0;

      // Skip if no phone number
      if (!memberPhone) {
        results.push({ subId, status: "skipped", reason: "No phone number" });
        continue;
      }

      // Format phone for WhatsApp (add country code if needed)
      let whatsappTo = memberPhone.replace(/\s/g, "");
      if (!whatsappTo.startsWith("+")) {
        whatsappTo = "+212" + whatsappTo.replace(/^0/, "");
      }

      // Build message
      const message = `Bonjour ${memberName} 👋\n\n` +
        `Votre ${subType} expire dans 3 jours (le ${sub.sub_end}).\n` +
        `Il vous reste ${remaining} DH à payer.\n\n` +
        `Merci de passer au gymnase pour renouveler votre abonnement et continuer à profiter de nos services !\n\n` +
        `— SportGym`;

      try {
        // Send via Twilio WhatsApp API
        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: `whatsapp:${twilioFrom}`,
              To: `whatsapp:${whatsappTo}`,
              Body: message,
            }),
          }
        );

        const twilioData = await twilioRes.json();
        const sent = twilioRes.ok;

        // Log the reminder
        await supabase.from("reminder_logs").insert({
          subscription_id: subId,
          member_name: memberName,
          member_phone: memberPhone,
          message: message,
          sent,
          twilio_sid: twilioData.sid || null,
          error_message: sent ? null : twilioData.message,
        });

        results.push({ subId, status: sent ? "sent" : "failed", to: whatsappTo });
        console.log(`Reminder for ${memberName} (${subId}): ${sent ? "SENT" : "FAILED"}`);
      } catch (err) {
        console.error(`Twilio error for ${memberName}:`, err.message);
        results.push({ subId, status: "error", error: err.message });
      }
    }

    return new Response(JSON.stringify({ success: true, checked: targetDateStr, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});