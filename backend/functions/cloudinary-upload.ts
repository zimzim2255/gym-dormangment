// ═══════════════════════════════════════════════════════════════════════════════
//  Cloudinary Image Upload - Edge Function
//  ───────────────────────────────────────────────────────────────────────────────
//  Uses unsigned upload with an upload preset (no signature needed).
//  Create an upload preset in Cloudinary Dashboard → Settings → Upload
//  Set: Signing Mode = Unsigned, Folder = gym-web-application
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

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME") || "tzgwtitg";
    const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET") || "gym_unsigned";

    // Build Cloudinary upload form (unsigned - no signature needed)
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", uploadPreset);

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