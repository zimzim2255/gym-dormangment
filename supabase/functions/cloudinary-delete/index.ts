// ═══════════════════════════════════════════════════════════════════════════════
//  Cloudinary Image Delete - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Deletes images from Cloudinary. The API secret stays server-side.
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { publicId } = await req.json();
    if (!publicId) {
      return new Response(JSON.stringify({ error: "Missing publicId" }), { status: 400 });
    }

    // Cloudinary wants: api_key, timestamp, signature
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "tzgwtitg";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY") || "797683664947181";
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") || "cVzkfUqkVoH2FnBZR8sdsfuZ4kE";
    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const signature = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""));

    const formData = new FormData();
    formData.append("public_id", publicId);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});