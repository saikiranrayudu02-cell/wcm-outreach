import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { listOmnidimCallLogs, resolveRecordingUrl } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

function getLogRequestId(log: any): string | null {
  if (!log) return null;
  if (typeof log.call_request_id === "object" && log.call_request_id !== null) {
    return String(log.call_request_id.id || "");
  }
  if (log.call_request_id) return String(log.call_request_id);
  if (log.request_id) return String(log.request_id);
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can sync call data." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { callAttemptId } = body;

    // Fetch attempts that need syncing:
    // If callAttemptId is passed, sync that specific attempt.
    // Otherwise sync all attempts from the last 24 hours to guarantee accuracy.
    const attemptsToSync: any[] = await (prisma as any).callAttempt.findMany({
      where: callAttemptId
        ? { id: callAttemptId }
        : {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    if (attemptsToSync.length === 0) {
      return NextResponse.json({
        message: "No call attempts require syncing.",
        syncedCount: 0,
      });
    }

    // Fetch latest provider logs from OmniDimension
    const { logs } = await listOmnidimCallLogs({ pageSize: 50 });

    let updatedCount = 0;

    for (const attempt of attemptsToSync) {
      // 1. High-precision match: by providerRequestId (dispatched requestId)
      let matchingLog = logs.find((log) => {
        const reqId = getLogRequestId(log);
        return Boolean(attempt.providerRequestId && reqId && reqId === String(attempt.providerRequestId));
      });

      // 2. Secondary match: by providerCallId (if already verified with provider)
      if (!matchingLog && attempt.providerCallId) {
        matchingLog = logs.find((log) => String(log.id) === String(attempt.providerCallId));
      }

      // 3. Fallback: match by phone number ONLY if timestamp is within 15 mins of call initiation
      // and the log does NOT belong to another dispatched request
      if (!matchingLog && attempt.toNumber) {
        const last10Digits = attempt.toNumber.replace(/\D/g, "").slice(-10);
        matchingLog = logs.find((log) => {
          if (!log.to_number || !log.to_number.includes(last10Digits)) return false;
          const reqId = getLogRequestId(log);
          if (reqId && attempt.providerRequestId && reqId !== String(attempt.providerRequestId)) {
            return false;
          }
          return true;
        });
      }

      if (matchingLog) {
        let mappedStatus: "DISPATCHED" | "COMPLETED" | "BUSY" | "FAILED" | "NO_ANSWER" | "IN_PROGRESS" | "CANCELLED" = "COMPLETED";
        const provStatus = (matchingLog.call_status || "").toLowerCase().trim();

        if (provStatus === "completed") {
          mappedStatus = "COMPLETED";
        } else if (provStatus === "busy") {
          mappedStatus = "BUSY";
        } else if (provStatus === "failed") {
          mappedStatus = "FAILED";
        } else if (provStatus === "no-answer" || provStatus === "no_answer" || provStatus === "voicemail_detected") {
          mappedStatus = "NO_ANSWER";
        } else if (provStatus === "in progress" || provStatus === "in_progress") {
          mappedStatus = "IN_PROGRESS";
        } else if (provStatus === "cancelled" || provStatus === "canceled") {
          mappedStatus = "CANCELLED";
        } else {
          mappedStatus = provStatus ? (provStatus.toUpperCase() as any) : "COMPLETED";
        }

        const isAnswered = mappedStatus === "COMPLETED";
        const recUrl = isAnswered && typeof matchingLog.recording_url === "string" ? resolveRecordingUrl(matchingLog.recording_url) : null;
        const transcript = isAnswered ? (matchingLog.call_conversation || null) : null;
        
        let summary: string | null = null;
        if (isAnswered) {
          summary = matchingLog.sentiment_analysis_details || attempt.summary || null;
        } else if (mappedStatus === "NO_ANSWER") {
          summary = "The recipient did not answer the call (no-answer). Contact is eligible for re-call.";
        } else if (mappedStatus === "BUSY") {
          summary = "The recipient's phone was busy. Contact is eligible for re-call.";
        } else if (mappedStatus === "FAILED") {
          summary = "Call failed to connect. Contact is eligible for re-call.";
        } else if (mappedStatus === "CANCELLED") {
          summary = "Call was cancelled.";
        }

        const duration = isAnswered ? (matchingLog.call_duration_in_seconds || 0) : 0;
        const durationFormatted = isAnswered ? (matchingLog.call_duration || "0:00") : "0:00";
        const sentiment = isAnswered ? (matchingLog.sentiment_score || "Neutral") : null;

        await (prisma as any).callAttempt.update({
          where: { id: attempt.id },
          data: {
            providerCallId: String(matchingLog.id),
            status: mappedStatus,
            duration,
            durationFormatted,
            recordingUrl: recUrl,
            transcript,
            summary,
            sentiment,
            endedAt: mappedStatus !== "DISPATCHED" && mappedStatus !== "IN_PROGRESS" ? new Date() : null,
          },
        });

        // Permanently lock verification sheet if answered
        if (isAnswered && duration > 0) {
          await (prisma as any).verificationSheet.update({
            where: { id: attempt.verificationSheetId },
            data: {
              isCallLocked: true,
              callAnsweredAt: new Date(),
              callLockedReason: `Call answered by recipient (Call ID: ${matchingLog.id}, Duration: ${duration}s)`,
            },
          });
        }

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${updatedCount} call attempt(s) from OmniDimension.`,
      syncedCount: updatedCount,
    });
  } catch (error: any) {
    console.error("Error in /api/calls/sync:", error);
    return NextResponse.json(
      { error: "Internal server error synchronizing calls." },
      { status: 500 }
    );
  }
}
