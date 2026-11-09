import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kzriewsievciwhicbudg.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

export const supabaseStorage = createClient(supabaseUrl, supabaseKey);

export const BUCKET_NAME = "wcm-media";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

export const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/webm",
];

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export interface MediaUploadValidation {
  valid: boolean;
  error?: string;
  mediaType?: "IMAGE" | "VIDEO";
}

export function validateMediaUpload(
  fileName: string,
  mimeType: string,
  fileSize: number,
  expectedKind: "IMAGE" | "VIDEO"
): MediaUploadValidation {
  const cleanMime = (mimeType || "").toLowerCase();
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (expectedKind === "IMAGE") {
    const isImageMime = ALLOWED_IMAGE_MIME_TYPES.includes(cleanMime);
    const isImageExt = ["jpg", "jpeg", "png", "webp"].includes(ext);
    if (!isImageMime && !isImageExt) {
      return {
        valid: false,
        error: "Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP.",
      };
    }
    if (fileSize > MAX_IMAGE_SIZE_BYTES) {
      return {
        valid: false,
        error: `Image size exceeds the 10MB limit (File is ${(fileSize / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }
    return { valid: true, mediaType: "IMAGE" };
  }

  if (expectedKind === "VIDEO") {
    const isVideoMime = ALLOWED_VIDEO_MIME_TYPES.includes(cleanMime);
    const isVideoExt = ["mp4", "mov", "webm"].includes(ext);
    if (!isVideoMime && !isVideoExt) {
      return {
        valid: false,
        error: "Invalid video format. Supported formats: MP4, MOV, WEBM.",
      };
    }
    if (fileSize > MAX_VIDEO_SIZE_BYTES) {
      return {
        valid: false,
        error: `Video size exceeds the 50MB storage limit (File is ${(fileSize / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }
    return { valid: true, mediaType: "VIDEO" };
  }

  return { valid: false, error: "Unsupported media category" };
}

export async function uploadToStorage(
  buffer: Buffer | Uint8Array,
  storagePath: string,
  contentType: string
): Promise<{ path: string; publicUrl: string }> {
  const { data, error } = await supabaseStorage.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabaseStorage.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    path: data.path,
    publicUrl: publicUrlData.publicUrl,
  };
}

export async function deleteFromStorage(storagePath: string): Promise<boolean> {
  try {
    const { error } = await supabaseStorage.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.warn("Storage deletion warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Storage deletion exception:", err);
    return false;
  }
}

