import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { dispatchOmnidimCall, normalizePhoneNumber } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

const dispatchSchema = z.object({
  verificationSheetId: z.string().uuid("Invalid verification sheet ID"),
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
        { error: "Forbidden: Only administrators can dispatch AI calls." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { verificationSheetId } = dispatchSchema.parse(body);

    // 1. Fetch verification sheet and verify eligibility
    const sheet: any = await (prisma as any).verificationSheet.findUnique({
      where: { id: verificationSheetId },
      include: {
        meetingReport: true,
        callAttempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sheet) {
      return NextResponse.json(
        { error: "Verification sheet not found." },
        { status: 404 }
      );
    }

    const isApproved =
      sheet.status === "COMPLETED" ||
      sheet.meetingReport?.status === "APPROVED" ||
      Boolean(sheet.approvedAt);

    if (!isApproved) {
      return NextResponse.json(
        {
          error:
            "Ineligible: Only verifications with COMPLETED / APPROVED status can be called.",
        },
        { status: 400 }
      );
    }

    // 2. Permanent Answered Call Lock Check
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

    // 3. Prevent accidental duplicate concurrent calls
    const activeAttempt = sheet.callAttempts?.find(
      (a: any) => a.status === "DISPATCHED" || a.status === "IN_PROGRESS"
    );

    if (activeAttempt) {
      // Check if it's been active for more than 15 minutes (stuck attempt fallback)
      const minutesAgo = (Date.now() - new Date(activeAttempt.initiatedAt).getTime()) / (1000 * 60);
      if (minutesAgo < 15) {
        return NextResponse.json(
          {
            error:
              "A call is already currently in progress for this contact. Please wait for it to complete.",
            activeAttemptId: activeAttempt.id,
          },
          { status: 409 }
        );
      }
    }

    // 3. Validate phone number
    const phoneValidation = normalizePhoneNumber(sheet.contactNumber);
    if (!phoneValidation.isValid || !phoneValidation.e164Number) {
      return NextResponse.json(
        {
          error:
            phoneValidation.error ||
            "The verification sheet has an invalid phone number.",
        },
        { status: 400 }
      );
    }

    const agentId = Number(process.env.OMNIDIM_AGENT_ID || 272514);
    const attemptNumber = (sheet.callAttempts?.length || 0) + 1;

    // 4. Create initial CallAttempt record
    const callAttempt = await (prisma as any).callAttempt.create({
      data: {
        verificationSheetId: sheet.id,
        meetingReportId: sheet.meetingReportId,
        initiatedById: userId,
        agentId,
        fromNumber: "WCM Voice Agent",
        toNumber: phoneValidation.e164Number,
        contactName: sheet.convenerName || "Convener",
        churchName: sheet.churchMinistryName || "Ministry Partner",
        status: "DISPATCHED",
        attemptNumber,
        parentAttemptId: sheet.callAttempts && sheet.callAttempts.length > 0 ? sheet.callAttempts[0].id : null,
        initiatedAt: new Date(),
        metadata: {
          convenerName: sheet.convenerName,
          churchName: sheet.churchMinistryName,
          meetingDates: sheet.meetingDates,
          city: sheet.stateDistrictCity,
          expectedAttendance: sheet.expectedAttendance,
        },
      },
    });

    // 5. Dispatch call to OmniDimension
    try {
      const dispatchResult = await dispatchOmnidimCall({
        toNumber: phoneValidation.e164Number,
        convenerName: sheet.convenerName,
        churchName: sheet.churchMinistryName,
        meetingDates: sheet.meetingDates,
        expectedAttendance: sheet.expectedAttendance,
        location: sheet.stateDistrictCity,
        verificationId: sheet.id,
        meetingReportId: sheet.meetingReportId,
        callAttemptId: callAttempt.id,
      });

      if (!dispatchResult.success) {
        await (prisma as any).callAttempt.update({
          where: { id: callAttempt.id },
          data: {
            status: "FAILED",
            errorCode: "PROVIDER_DISPATCH_ERROR",
            errorMessage: dispatchResult.error || "Failed to dispatch call to OmniDimension.",
          },
        });

        return NextResponse.json(
          {
            error: dispatchResult.error || "Failed to dispatch outbound call.",
            attemptId: callAttempt.id,
          },
          { status: 502 }
        );
      }

      // Update with provider requestId
      const updatedAttempt = await (prisma as any).callAttempt.update({
        where: { id: callAttempt.id },
        data: {
          providerRequestId: dispatchResult.requestId ? String(dispatchResult.requestId) : null,
          status: "DISPATCHED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "AI voice call dispatched successfully.",
        callAttempt: updatedAttempt,
      });
    } catch (dispatchError: any) {
      await (prisma as any).callAttempt.update({
        where: { id: callAttempt.id },
        data: {
          status: "FAILED",
          errorCode: "PROVIDER_EXCEPTION",
          errorMessage: dispatchError?.message || "Unexpected exception during call dispatch.",
        },
      });

      return NextResponse.json(
        {
          error: dispatchError?.message || "Internal error dispatching AI voice call.",
          attemptId: callAttempt.id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const issue = (error as any).issues?.[0] || (error as any).errors?.[0];
      return NextResponse.json(
        { error: issue?.message || "Invalid request payload." },
        { status: 400 }
      );
    }

    console.error("Error in /api/calls/dispatch:", error);
    return NextResponse.json(
      { error: "Internal server error dispatching call." },
      { status: 500 }
    );
  }
}
