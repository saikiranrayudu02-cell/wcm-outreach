import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  validateMediaUpload,
  uploadToStorage,
  deleteFromStorage,
} from "@/lib/storage";

export const maxDuration = 60; // Allow 60s for video uploads

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const category = formData.get("category") as string | null;
    const recordId = (formData.get("recordId") as string) || "draft";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!category || !["VERIFICATION_IMAGE", "EVALUATION_IMAGE", "EVALUATION_VIDEO"].includes(category)) {
      return NextResponse.json(
        { error: "Invalid media category. Must be VERIFICATION_IMAGE, EVALUATION_IMAGE, or EVALUATION_VIDEO" },
        { status: 400 }
      );
    }

    const expectedKind = category === "EVALUATION_VIDEO" ? "VIDEO" : "IMAGE";
    const validation = validateMediaUpload(file.name, file.type, file.size, expectedKind);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Determine storage folder structure according to requirements:
    // verification-images/verification-id/fileName
    // evaluation-images/evaluation-id/fileName
    // evaluation-videos/evaluation-id/fileName
    let folder = "verification-images";
    if (category === "EVALUATION_IMAGE") folder = "evaluation-images";
    if (category === "EVALUATION_VIDEO") folder = "evaluation-videos";

    const sanitizedRecordId = recordId.replace(/[^a-zA-Z0-9_-]/g, "");
    const safeBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${Date.now()}_${safeBaseName}`;
    const storagePath = `${folder}/${sanitizedRecordId}/${uniqueFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { path, publicUrl } = await uploadToStorage(buffer, storagePath, file.type || "application/octet-stream");

    return NextResponse.json({
      success: true,
      media: {
        fileName: file.name,
        storagePath: path,
        fileUrl: publicUrl,
        fileSize: file.size,
        mimeType: file.type || (expectedKind === "VIDEO" ? "video/mp4" : "image/jpeg"),
        mediaType: validation.mediaType,
      },
    });
  } catch (err: any) {
    console.error("POST /api/media/upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload media file" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storagePath } = await request.json();
    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }

    const deleted = await deleteFromStorage(storagePath);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("DELETE /api/media/upload error:", err);
    return NextResponse.json({ error: "Failed to delete media from storage" }, { status: 500 });
  }
}

