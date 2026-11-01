import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { dispatchOmnidimCall, normalizePhoneNumber } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

const retrySchema = z.object({
  previousAttemptId: z.string().uuid("Invalid previous attempt ID"),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can retry calls." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { previousAttemptId } = retrySchema.parse(body);

    // 1. Fetch previous attempt and sheet
    const prevAttempt: any = await (prisma as any).callAttempt.findUnique({
      where: { id: previousAttemptId },
      include: {
        verificationSheet: {
          include: {
            meetingReport: true,
            callAttempts: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!prevAttempt) {
      return NextResponse.json({ error: "Previous call attempt not found." }, { status: 404 });
    }

    const sheet = prevAttempt.verificationSheet;

    // 1.5. Permanent Answered Call Lock Check
    if (sheet.isCallLocked) {
      return NextResponse.json(
        {
          error:
            sheet.callLockedReason ||
            "Call Locked: This verification has already been answered by the recipient. Further calls are permanently disabled.",
          locked: true,
          callAnsweredAt: sheet.callAnsweredAt,
        },
        { status: 409 }
      );
    }

    const previouslyAnswered = sheet.callAttempts?.find(
      (a: any) =>
        (a.status === "COMPLETED" && (a.duration || 0) > 0) ||
        Boolean(a.answeredAt)
    );
    if (previouslyAnswered) {
      await (prisma as any).verificationSheet.update({
        where: { id: sheet.id },
        data: {
          isCallLocked: true,
          callAnsweredAt: previouslyAnswered.answeredAt || previouslyAnswered.createdAt,
          callLockedReason: `Call answered by recipient (Call ID: ${previouslyAnswered.providerCallId || previouslyAnswered.id}, Duration: ${previouslyAnswered.duration || 0}s)`,
        },
      });
      return NextResponse.json(
        {
          error:
            "Call Locked: This verification has already been answered by the recipient. Further calls are permanently disabled.",
          locked: true,
        },
        { status: 409 }
      );
    }

    // Verify previous attempt was in a retryable state
    if (prevAttempt.status === "COMPLETED" && (prevAttempt.duration || 0) > 0) {
      return NextResponse.json(
        { error: "This call was already completed and answered. Retry is not permitted." },
        { status: 400 }
      );
    }

    // 2. Prevent concurrent call if any attempt is active
    const activeAttempt = sheet.callAttempts?.find(
      (a: any) => a.status === "DISPATCHED" || a.status === "IN_PROGRESS"
    );

    if (activeAttempt) {
      const minutesAgo = (Date.now() - new Date(activeAttempt.initiatedAt).getTime()) / (1000 * 60);
      if (minutesAgo < 15) {
        return NextResponse.json(
          { error: "A call is already currently in progress. Please wait for it to conclude." },
          { status: 409 }
        );
      }
    }

    // 3. Retry safeguards: max 5 attempts
    const totalAttempts = sheet.callAttempts?.length || 0;
    if (totalAttempts >= 5) {
      return NextResponse.json(
        { error: "Maximum retry limit (5 attempts) reached for this verification contact." },
        { status: 400 }
      );
    }

    // 4. Validate phone number
    const phoneValidation = normalizePhoneNumber(sheet.contactNumber);
    if (!phoneValidation.isValid || !phoneValidation.e164Number) {
      return NextResponse.json(
        { error: "Invalid destination phone number." },
        { status: 400 }
      );
    }

    const agentId = Number(process.env.OMNIDIM_AGENT_ID || 272514);
    const attemptNumber = totalAttempts + 1;

    // 5. Create new CallAttempt linked to parent
    const newAttempt: any = await (prisma as any).callAttempt.create({
      data: {
        verificationSheetId: sheet.id,
        meetingReportId: sheet.meetingReportId,
        initiatedById: userId,
        agentId,
        fromNumber: "WCM Voice Agent",
        toNumber: phoneValidation.e164Number,
        contactName: sheet.convenerName || prevAttempt.contactName,
        churchName: sheet.churchMinistryName || prevAttempt.churchName,
        status: "DISPATCHED",
        attemptNumber,
        parentAttemptId: prevAttempt.id,
        initiatedAt: new Date(),
        metadata: {
          isRetry: true,
          previousAttemptId: prevAttempt.id,
          previousStatus: prevAttempt.status,
          convenerName: sheet.convenerName,
          churchName: sheet.churchMinistryName,
        },
      },
    });

    // 6. Dispatch call
    const dispatchResult = await dispatchOmnidimCall({
      toNumber: phoneValidation.e164Number,
      convenerName: sheet.convenerName,
      churchName: sheet.churchMinistryName,
      meetingDates: sheet.meetingDates,
      expectedAttendance: sheet.expectedAttendance,
      location: sheet.stateDistrictCity,
      verificationId: sheet.id,
      meetingReportId: sheet.meetingReportId,
      callAttemptId: newAttempt.id,
    });

    if (!dispatchResult.success) {
      await (prisma as any).callAttempt.update({
        where: { id: newAttempt.id },
        data: {
          status: "FAILED",
          errorCode: "PROVIDER_RETRY_ERROR",
          errorMessage: dispatchResult.error || "Failed to retry call with provider.",
        },
      });

      return NextResponse.json(
        { error: dispatchResult.error || "Provider failed to dispatch retry call." },
        { status: 502 }
      );
    }

    const updatedAttempt = await (prisma as any).callAttempt.update({
      where: { id: newAttempt.id },
      data: {
        providerRequestId: dispatchResult.requestId ? String(dispatchResult.requestId) : null,
        status: "DISPATCHED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Call retry (attempt #${attemptNumber}) dispatched successfully.`,
      callAttempt: updatedAttempt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const issue = (error as any).issues?.[0] || (error as any).errors?.[0];
      return NextResponse.json({ error: issue?.message || "Invalid retry payload." }, { status: 400 });
    }
    console.error("Error in /api/calls/retry:", error);
    return NextResponse.json({ error: "Internal server error retrying call." }, { status: 500 });
  }
}
