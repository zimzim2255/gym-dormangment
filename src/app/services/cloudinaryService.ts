// ═══════════════════════════════════════════════════════════════════════════════
//  Cloudinary Image Upload Service
//  ───────────────────────────────────────────────────────────────────────────────
//  Uploads images directly from browser to Cloudinary using unsigned upload.
//  Returns the secure URL which is stored in the database (not the raw image).
//  ⚠ API secret is NEVER exposed to frontend - Cloudinary uses it server-side
// ═══════════════════════════════════════════════════════════════════════════════

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = "ml_default"; // Create a signed or unsigned upload preset in Cloudinary dashboard
const UPLOAD_FOLDER = import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER || "gym-web-application";
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

/**
 * Upload an image file to Cloudinary
 * @param file - The image File object from an <input type="file">
 * @param publicId - Optional custom public ID (e.g. member ID like "ADH001")
 * @returns The secure URL of the uploaded image
 */
export async function uploadMemberPhoto(file: File, publicId?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", UPLOAD_FOLDER);
  formData.append("api_key", API_KEY);

  if (publicId) {
    formData.append("public_id", publicId);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return data.secure_url; // Store this URL in DB
}

/**
 * Upload a photo by URL (for copying existing images)
 */
export async function uploadMemberPhotoByUrl(imageUrl: string, publicId?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", imageUrl);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", UPLOAD_FOLDER);
  formData.append("api_key", API_KEY);

  if (publicId) {
    formData.append("public_id", publicId);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

/**
 * Delete a member photo from Cloudinary
 * @param imageUrl - The full Cloudinary URL (we extract the public_id)
 */
export async function deleteMemberPhoto(imageUrl: string): Promise<void> {
  // Extract public_id from URL: "https://res.cloudinary.com/.../image/upload/v12345/gym-web-application/ADH001.jpg"
  const parts = imageUrl.split("/");
  const filename = parts[parts.length - 1];
  const publicId = `${UPLOAD_FOLDER}/${filename.split(".")[0]}`;

  // This requires the backend edge function (signature needed)
  // For now, we call our own edge function to handle deletion server-side
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ publicId }),
    }
  );

  if (!res.ok) {
    console.warn("Could not delete old photo from Cloudinary");
  }
}