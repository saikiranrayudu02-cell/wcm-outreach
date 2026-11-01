import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveRecordingUrl } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

function getLogRequestId(payload: any): string | null {
  if (!payload) return null;
  if (typeof payload.call_request_id === "object" && payload.call_request_id !== null) {
    return String(payload.call_request_id.id || "");
  }
  if (payload.call_request_id) return String(payload.call_request_id);
  if (payload.request_id) return String(payload.request_id);
  if (payload.requestId) return String(payload.requestId);
  return null;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));

    // OmniDimension post-call webhook payload
    const callLogId = payload.id || payload.call_id || payload.callLogId;
    const metadata = payload.metadata || {};
    const callAttemptId = metadata.call_attempt_id || payload.call_attempt_id;
    const reqId = getLogRequestId(payload);
    const rawStatus = (payload.call_status || payload.status || "").toLowerCase().trim();

    // Map provider status to internal status
    let mappedStatus: "COMPLETED" | "BUSY" | "FAILED" | "NO_ANSWER" | "CANCELLED" = "COMPLETED";
    if (rawStatus === "completed") mappedStatus = "COMPLETED";
    else if (rawStatus === "busy") mappedStatus = "BUSY";
    else if (rawStatus === "failed") mappedStatus = "FAILED";
    else if (rawStatus === "no-answer" || rawStatus === "no_answer" || rawStatus === "voicemail_detected") mappedStatus = "NO_ANSWER";
    else if (rawStatus === "canceled" || rawStatus === "cancelled") mappedStatus = "CANCELLED";

    const isAnswered = mappedStatus === "COMPLETED";
    const recordingUrl = isAnswered && typeof payload.recording_url === "string" ? resolveRecordingUrl(payload.recording_url) : null;
    const transcript = isAnswered ? (payload.call_conversation || payload.transcript || null) : null;
    
    let summary: string | null = null;
    if (isAnswered) {
      summary = payload.sentiment_analysis_details || payload.summary || null;
    } else if (mappedStatus === "NO_ANSWER") {
      summary = "The recipient did not answer the call (no-answer). Contact is eligible for re-call.";
    } else if (mappedStatus === "BUSY") {
      summary = "The recipient's phone was busy. Contact is eligible for re-call.";
    } else if (mappedStatus === "FAILED") {
      summary = "Call failed to connect. Contact is eligible for re-call.";
    } else if (mappedStatus === "CANCELLED") {
      summary = "Call was cancelled.";
    }

    const duration = isAnswered ? (typeof payload.call_duration_in_seconds === "number" ? payload.call_duration_in_seconds : 0) : 0;
    const durationFormatted = isAnswered ? (payload.call_duration || "0:00") : "0:00";
    const sentiment = isAnswered ? (payload.sentiment_score || "Neutral") : null;

    let targetAttempt = null;

    // 1. First attempt to match by explicit callAttemptId from metadata
    if (callAttemptId) {
      targetAttempt = await (prisma as any).callAttempt.findUnique({
        where: { id: callAttemptId },
      });
    }

    // 2. Second fallback: match by providerRequestId
    if (!targetAttempt && reqId) {
      targetAttempt = await (prisma as any).callAttempt.findFirst({
        where: { providerRequestId: String(reqId) },
      });
    }

    // 3. Third fallback: match by providerCallId
    if (!targetAttempt && callLogId) {
      targetAttempt = await (prisma as any).callAttempt.findFirst({
        where: { providerCallId: String(callLogId) },
      });
    }

    // 4. Fourth fallback: match by destination phone number and active status
    if (!targetAttempt && payload.to_number) {
      const last10Digits = payload.to_number.replace(/\D/g, "").slice(-10);
      targetAttempt = await (prisma as any).callAttempt.findFirst({
        where: {
          toNumber: { contains: last10Digits },
          status: { in: ["DISPATCHED", "IN_PROGRESS"] },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (targetAttempt) {
      await (prisma as any).callAttempt.update({
        where: { id: targetAttempt.id },
        data: {
          providerCallId: callLogId ? String(callLogId) : targetAttempt.providerCallId,
          status: mappedStatus,
          duration,
          durationFormatted,
          recordingUrl,
          transcript,
          summary,
          sentiment,
          endedAt: new Date(),
        },
      });

      if (isAnswered && duration > 0) {
        await (prisma as any).verificationSheet.update({
          where: { id: targetAttempt.verificationSheetId },
          data: {
            isCallLocked: true,
            callAnsweredAt: new Date(),
            callLockedReason: `Call answered by recipient (Call ID: ${callLogId || targetAttempt.providerCallId || targetAttempt.id}, Duration: ${duration}s)`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Call attempt successfully updated from webhook.",
        attemptId: targetAttempt.id,
      });
    }

    // If no matching attempt found, record acknowledgment to prevent retries
    return NextResponse.json({
      success: true,
      message: "Webhook acknowledged; no matching local attempt record found.",
    });
  } catch (error: any) {
    console.error("Error processing OmniDimension webhook:", error);
    return NextResponse.json(
      { success: false, error: "Error processing webhook." },
      { status: 200 }
    );
  }
}
