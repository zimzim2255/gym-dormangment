// ═══════════════════════════════════════════════════════════════════════════════
//  Cloudinary Image Upload - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Handles signed uploads to Cloudinary. The API secret stays server-side.
//  No upload preset required - uses SHA-1 signature for authentication.
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const publicId = formData.get("public_id") as string | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "tzgwtitg";
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY") || "797683664947181";
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET") || "cVzkfUqkVoH2FnBZR8sdsfuZ4kE";
    const folder = Deno.env.get("CLOUDINARY_UPLOAD_FOLDER") || "gym-web-application";
    const timestamp = Math.round(Date.now() / 1000);

    // Build signature — Cloudinary requires parameters sorted ALPHABETICALLY
    const params: Record<string, string> = {
      folder,
      timestamp: timestamp.toString(),
    };
    if (publicId) params["public_id"] = publicId;
    const sortedKeys = Object.keys(params).sort();
    const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&") + apiSecret;

    const signature = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""));

    // Build Cloudinary upload form
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("api_key", apiKey);
    cloudForm.append("timestamp", timestamp.toString());
    cloudForm.append("signature", signature);
    cloudForm.append("folder", folder);
    if (publicId) cloudForm.append("public_id", publicId);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: cloudForm,
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "Upload failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ secure_url: data.secure_url, public_id: data.public_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});