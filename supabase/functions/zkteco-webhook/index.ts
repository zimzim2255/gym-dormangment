// ═══════════════════════════════════════════════════════════════════════════════
//  ZKTeco SenseFace 3A/3B Webhook - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Called by the terminal when a user scans face/fingerprint/RFID/QR.
//  Terminal sends: { userId, verifyMode, timestamp, serialNumber, confidence }
//  We respond:     { decision: "GRANTED" | "DENIED", message }
//
//  Logic:
//  1. Member must exist and be "Actif"
//  2. Subscription must be within valid date range (start ≤ today ≤ end)
//  3. Subscription must be "Payé" or have at least partial payment
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ─── ZKTeco PUSH protocol types ──────────────────────────────────────────────
// This matches what the SenseFace 3A terminal sends over HTTP

interface ZKTecoPushEvent {
  serialNumber?: string;      // Terminal serial (e.g. "TERMINAL_001")
  eventType: string;          // "CHECK_IN" (device) | "ACCESS" (connector)
  userId: string;             // User ID from terminal DB (e.g. "ADH001")
  verifyMode?: number;        // 1=Fingerprint, 2=Face, 3=RFID, 4=QR, 5=Password
  timestamp: string;          // ISO datetime of the scan
  confidence?: number;        // Recognition confidence % (0-100)
  // ─── GymDoorConnector normalized payload (optional aliases) ──────────
  connectorId?: string;       // e.g. "GYM_PC_001"
  deviceId?: string;          // terminal device id (alias for serialNumber)
  method?: string;            // "fingerprint" | "face" | ... (alias for verifyMode)
  eventId?: string;           // idempotency key - echoed back in the response
}

const VERIFY_MODE_MAP: Record<number, string> = {
  1: "fingerprint",
  2: "face",
  3: "rfid",
  4: "qr",
  5: "password",
};

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // ─── Optional Bearer authentication ─────────────────────────────────────────
  // Keys checked (choose any that Supabase allows; avoids the reserved
  // "SUPABASE_" prefix restriction on the secret store):
  //   ZKTECO_WEBHOOK_SECRET, WEBHOOK_SECRET, GYM_DOOR_SECRET,
  //   SUPABASE_WEBHOOK_SECRET (legacy/backward-compat)
  const webhookSecret =
    Deno.env.get("ZKTECO_WEBHOOK_SECRET") ||
    Deno.env.get("WEBHOOK_SECRET") ||
    Deno.env.get("GYM_DOOR_SECRET") ||
    Deno.env.get("SUPABASE_WEBHOOK_SECRET");
  if (webhookSecret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${webhookSecret}`) {
      return new Response(JSON.stringify({
        decision: "UNAUTHORIZED",
        message: "Missing or invalid Authorization header",
        eventId: null,
      }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const generateSessionId = (userId: string, serial: string | undefined): string => {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 6);
    return `sess_${ts}_${serial ?? "?"}_${userId}_${rand}`;
  };

  try {
    // ZKTeco terminals can send both JSON and form-encoded data
    let body: ZKTecoPushEvent;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      // ZKTeco sometimes sends URL-encoded form data
      const form = await req.formData();
      body = {
        serialNumber: form.get("serialNumber") as string,
        eventType: form.get("eventType") as "CHECK_IN",
        userId: form.get("userId") as string,
        verifyMode: Number(form.get("verifyMode")),
        timestamp: form.get("timestamp") as string,
        confidence: form.get("confidence") ? Number(form.get("confidence")) : undefined,
      };
    }

    const startTime = performance.now();

    // ─── Normalize connector payload into the internal event shape ───────────
    // Accept BOTH the raw ZKTeco PUSH keys (serialNumber / verifyMode) and the
    // GymDoorConnector normalized keys (deviceId / method).
    if (!body.serialNumber && body.deviceId) body.serialNumber = body.deviceId;
    if (!body.serialNumber) body.serialNumber = "UNKNOWN_TERMINAL";
    if (typeof body.method === "string" && body.method !== "" && !body.verifyMode) {
      const m = body.method.toLowerCase().trim();
      if (m === "fingerprint" || m === "fp") body.verifyMode = 1;
      else if (m === "face") body.verifyMode = 2;
      else if (m === "rfid" || m === "card" || m === "ic") body.verifyMode = 3;
      else if (m === "qr") body.verifyMode = 4;
      else if (m === "password" || m === "pin") body.verifyMode = 5;
      else body.verifyMode = 0;
    }
    if (!body.verifyMode) body.verifyMode = 1; // fingerprint default

    const sessionId = generateSessionId(body.userId, body.serialNumber);
    const method = VERIFY_MODE_MAP[body.verifyMode] || "fingerprint";

    // ─── Step 1: Find member ─────────────────────────────────────────
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, phone, status")
      .eq("id", body.userId)
      .single();

    if (memberError || !member) {
      const msg = "Membre introuvable dans le système";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    if (member.status !== "Actif") {
      const msg = "Compte suspendu";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    // ─── Step 2: Find active subscription ────────────────────────────
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("member_id", body.userId)
      .order("sub_end", { ascending: false })
      .limit(1)
      .single();

    if (!subscription) {
      const msg = "Aucun abonnement trouvé";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    // ─── Step 3: Check subscription date range ───────────────────────
    // Format: "01/07/2025" (French date format)
    const today = new Date();
    const parseFrDate = (dateStr: string): Date | null => {
      const parts = dateStr.split("/");
      if (parts.length !== 3) return null;
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    };

    const startDate = parseFrDate(subscription.sub_start);
    const endDate = parseFrDate(subscription.sub_end);

    if (!startDate || !endDate) {
      const msg = "Erreur de configuration d'abonnement";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    // Normalize dates to compare without time
    const todayNorm = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (todayNorm < startDate) {
      const msg = "Abonnement pas encore actif";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    if (todayNorm > endDate) {
      const msg = "Abonnement expiré";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    // ─── Step 4: Check payment status ────────────────────────────────
    if (subscription.sub_status === "Non payé") {
      const msg = "Abonnement non payé";
      await logDenied(supabase, sessionId, body, method, msg);
      return respond(sessionId, "DENIED", msg, startTime, body.eventId);
    }

    // ─── Step 5: GRANTED (with optional partial payment warning) ─────
    let decision: "GRANTED" | "PENDING_PAYMENT" = "GRANTED";
    let message = "Accès autorisé. Bon sport !";
    let status: "Autorisé" | "Paiement restant" = "Autorisé";

    if (subscription.sub_status === "Paiement partiel") {
      decision = "PENDING_PAYMENT";
      message = `Accès autorisé. Paiement restant: ${subscription.remaining} DH`;
      status = "Paiement restant";
    }

    // Log session
    await supabase.from("access_sessions").insert({
      session_id: sessionId,
      member_id: member.id,
      device_id: body.serialNumber,
      method,
      status: "approved",
      decision,
      decision_message: message,
      remaining_amount: subscription.remaining || 0,
      execution_time_ms: Math.round(performance.now() - startTime),
      confidence: body.confidence || null,
    });

    // Log access entry
    const now = new Date();
    await supabase.from("access_logs").insert({
      session_id: sessionId,
      member_id: member.id,
      member_name: member.name,
      phone: member.phone || "",
      subscription_type: subscription.sub_type,
      date: now.toLocaleDateString("fr-FR"),
      time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status,
      remaining: subscription.remaining || 0,
      device: body.serialNumber,
      method,
    });

    return respond(sessionId, decision, message, startTime, body.eventId);

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({
      sessionId: "",
      decision: "ERROR",
      message: "Erreur interne du serveur",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function respond(
  sessionId: string,
  decision: string,
  message: string,
  startTime: number,
  eventId?: string
) {
  return new Response(JSON.stringify({
    sessionId,
    decision,
    message,
    eventId: eventId || sessionId,
    executionTime: `${Math.round(performance.now() - startTime)}ms`,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

async function logDenied(supabase: any, sessionId: string, event: ZKTecoPushEvent, method: string, message: string) {
  const methodLabel = VERIFY_MODE_MAP[event.verifyMode || 1] || "unknown";
  await supabase.from("access_sessions").insert({
    session_id: sessionId,
    member_id: event.userId,
    device_id: event.serialNumber || "UNKNOWN_TERMINAL",
    method,
    status: "denied",
    decision: "DENIED",
    decision_message: message,
    remaining_amount: 0,
    execution_time_ms: 0,
    confidence: event.confidence || null,
  });
  const now = new Date();
  await supabase.from("access_logs").insert({
    session_id: sessionId,
    member_id: event.userId,
    member_name: event.userId,
    phone: "",
    subscription_type: "—",
    date: now.toLocaleDateString("fr-FR"),
    time: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    status: "Refusé",
    remaining: 0,
    device: event.serialNumber,
    method,
  });
  console.log(`🚫 DENIED: ${event.userId} via ${methodLabel} on ${event.serialNumber} - ${message}`);
}