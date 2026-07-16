// ═══════════════════════════════════════════════════════════════════════════════
//  Cloudinary Image Upload Service
//  ───────────────────────────────────────────────────────────────────────────────
//  Uploads via our edge function (server-side signed upload).
//  No upload preset needed - the API secret stays server-side.
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Upload an image file to Cloudinary via our edge function
 * @param file - The image File object from an <input type="file">
 * @param publicId - Optional custom public ID (e.g. member ID like "ADH001")
 * @returns The secure URL of the uploaded image
 */
export async function uploadMemberPhoto(file: File, publicId?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (publicId) formData.append("public_id", publicId);

  const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

/**
 * Delete a member photo from Cloudinary via our edge function
 */
export async function deleteMemberPhoto(imageUrl: string): Promise<void> {
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1];
  const folder = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || "gym-web-application";
  const publicId = `${folder}/${filename.split(".")[0]}`;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/cloudinary-delete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ publicId }),
  });

  if (!res.ok) {
    console.warn("Could not delete old photo from Cloudinary");
  }
}