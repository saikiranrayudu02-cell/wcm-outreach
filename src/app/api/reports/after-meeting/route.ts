import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();
    const { meetingId, submit = false, ...rData } = body;

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required to associate After-Meeting Evaluation Form with a meeting." }, { status: 400 });
    }

    const meeting = await prisma.meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
        leaderId: user.role === "ADMIN" ? undefined : user.id,
      },
      include: {
        verificationSheet: true,
        afterMeetingReport: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found or you are not authorized" }, { status: 404 });
    }

    // Strict Lock Enforcement: After-Meeting Evaluation Form is locked until Verification Form receives final Admin approval
    if (meeting.verificationSheet?.status !== "COMPLETED") {
      return NextResponse.json({
        error: "After-Meeting Evaluation Form is locked until Verification Form receives final Admin approval.",
      }, { status: 400 });
    }

    const updatedRecord = await prisma.afterMeetingReport.upsert({
      where: { meetingReportId: meeting.id },
      create: {
        meetingReportId: meeting.id,
        status: submit ? "SUBMITTED" : "PENDING",
        submittedAt: submit ? new Date() : undefined,
        overallMeetingOutcome: rData.overallMeetingOutcome || "",
        congregationResponse: rData.congregationResponse || "",
        continueFellowship: rData.continueFellowship === true || rData.continueFellowship === "true",
        futureOpportunities: rData.futureOpportunities || [],
        localChurchInfluence: rData.localChurchInfluence || "",
        networkOfPastors: rData.networkOfPastors || "",
        strengthsObserved: rData.strengthsObserved || "",
        challengesObserved: rData.challengesObserved || "",
        opportunityForWcm: rData.opportunityForWcm || "",
        coordinatorName: rData.coordinatorName || "",
        designation: rData.designation || "",
        signature: rData.signature || "",
        submissionDate: rData.submissionDate ? new Date(rData.submissionDate) : new Date(),
        followingWcmMembersCount: rData.followingWcmMembersCount !== undefined ? Number(rData.followingWcmMembersCount) : 0,
      },
      update: {
        status: submit ? "SUBMITTED" : undefined,
        submittedAt: submit ? new Date() : undefined,
        overallMeetingOutcome: rData.overallMeetingOutcome,
        congregationResponse: rData.congregationResponse,
        continueFellowship: rData.continueFellowship === true || rData.continueFellowship === "true",
        futureOpportunities: rData.futureOpportunities,
        localChurchInfluence: rData.localChurchInfluence,
        networkOfPastors: rData.networkOfPastors,
        strengthsObserved: rData.strengthsObserved,
        challengesObserved: rData.challengesObserved,
        opportunityForWcm: rData.opportunityForWcm,
        coordinatorName: rData.coordinatorName,
        designation: rData.designation,
        signature: rData.signature,
        submissionDate: rData.submissionDate ? new Date(rData.submissionDate) : undefined,
        followingWcmMembersCount: rData.followingWcmMembersCount !== undefined ? Number(rData.followingWcmMembersCount) : undefined,
      },
    });

    await prisma.reportAuditLog.create({
      data: {
        meetingReportId: meeting.id,
        actorId: user.id,
        action: submit ? "EVALUATION_SUBMITTED" : "EVALUATION_SAVED",
        details: submit ? "After-Meeting Evaluation Form submitted for review" : "After-Meeting Evaluation Form draft saved",
        formType: "EVALUATION",
      },
    });

    return NextResponse.json({
      message: submit ? "After-Meeting Evaluation Form submitted successfully" : "After-Meeting Evaluation Form saved successfully",
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: updatedRecord.status,
    });
  } catch (err) {
    console.error("POST /api/reports/after-meeting error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
