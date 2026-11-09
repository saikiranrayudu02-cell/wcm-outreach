import { prisma } from "@/lib/prisma";
import { deleteFromStorage } from "@/lib/storage";

export interface MediaItemInput {
  id?: string;
  fileName: string;
  storagePath: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  mediaType?: "IMAGE" | "VIDEO";
}

export async function syncVerificationMedia(
  verificationSheetId: string,
  mediaList: MediaItemInput[] = []
) {
  try {
    // 1. Fetch existing media records for this verification sheet
    const existing = await prisma.verificationMedia.findMany({
      where: { verificationSheetId },
    });

    const activePaths = new Set(mediaList.map((m) => m.storagePath));

    // 2. Identify removed media
    const removed = existing.filter((m) => !activePaths.has(m.storagePath));
    if (removed.length > 0) {
      const removedIds = removed.map((m) => m.id);
      await prisma.verificationMedia.deleteMany({
        where: { id: { in: removedIds } },
      });

      // Cleanup files from storage asynchronously
      for (const item of removed) {
        deleteFromStorage(item.storagePath).catch((err) => {
          console.warn("Storage cleanup failed for removed verification media:", err);
        });
      }
    }

    // 3. Upsert / Insert new active media
    for (const item of mediaList) {
      if (!item.storagePath || !item.fileUrl) continue;

      const alreadyExists = existing.find((m) => m.storagePath === item.storagePath);
      if (!alreadyExists) {
        await prisma.verificationMedia.create({
          data: {
            verificationSheetId,
            mediaType: "IMAGE",
            fileName: item.fileName || "verification-image.jpg",
            storagePath: item.storagePath,
            fileUrl: item.fileUrl,
            fileSize: Number(item.fileSize) || 0,
            mimeType: item.mimeType || "image/jpeg",
          },
        });
      }
    }
  } catch (err) {
    console.error("syncVerificationMedia error:", err);
    throw err;
  }
}

export async function syncEvaluationMedia(
  afterMeetingReportId: string,
  mediaList: MediaItemInput[] = []
) {
  try {
    // 1. Fetch existing media records for this evaluation report
    const existing = await prisma.evaluationMedia.findMany({
      where: { afterMeetingReportId },
    });

    const activePaths = new Set(mediaList.map((m) => m.storagePath));

    // 2. Identify removed media
    const removed = existing.filter((m) => !activePaths.has(m.storagePath));
    if (removed.length > 0) {
      const removedIds = removed.map((m) => m.id);
      await prisma.evaluationMedia.deleteMany({
        where: { id: { in: removedIds } },
      });

      // Cleanup files from storage asynchronously
      for (const item of removed) {
        deleteFromStorage(item.storagePath).catch((err) => {
          console.warn("Storage cleanup failed for removed evaluation media:", err);
        });
      }
    }

    // 3. Upsert / Insert new active media
    for (const item of mediaList) {
      if (!item.storagePath || !item.fileUrl) continue;

      const alreadyExists = existing.find((m) => m.storagePath === item.storagePath);
      if (!alreadyExists) {
        await prisma.evaluationMedia.create({
          data: {
            afterMeetingReportId,
            mediaType: item.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
            fileName: item.fileName || (item.mediaType === "VIDEO" ? "evaluation-video.mp4" : "evaluation-image.jpg"),
            storagePath: item.storagePath,
            fileUrl: item.fileUrl,
            fileSize: Number(item.fileSize) || 0,
            mimeType: item.mimeType || (item.mediaType === "VIDEO" ? "video/mp4" : "image/jpeg"),
          },
        });
      }
    }
  } catch (err) {
    console.error("syncEvaluationMedia error:", err);
    throw err;
  }
}

