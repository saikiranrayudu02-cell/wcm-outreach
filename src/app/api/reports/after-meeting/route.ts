import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { syncEvaluationMedia } from "@/lib/media-sync";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const meetingId = searchParams.get("meetingId") || searchParams.get("id") || searchParams.get("reportId");

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId parameter is required" }, { status: 400 });
    }

    const meeting: any = await (prisma as any).meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
      },
      include: {
        afterMeetingReport: {
          include: {
            media: true,
          },
        },
      },
    });

    if (!meeting || !meeting.afterMeetingReport) {
      return NextResponse.json({ error: "Evaluation report not found" }, { status: 404 });
    }

    return NextResponse.json({
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: meeting.status,
      afterMeetingReport: meeting.afterMeetingReport,
    });
  } catch (err) {
    console.error("GET /api/reports/after-meeting error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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
    const { meetingId, submit = false, images, video, videos, media, ...rData } = body;

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required to associate After-Meeting Evaluation Form with a meeting." }, { status: 400 });
    }

    const isPrivileged = ["ADMIN", "STATE_LEADER", "ZONE_LEADER"].includes(user.role);
    const meeting: any = await (prisma as any).meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
        leaderId: isPrivileged ? undefined : user.id,
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

    // Process evaluation media (Images + Video)
    let imageList = Array.isArray(images) ? images : [];
    let videoList = Array.isArray(videos) ? videos : video ? [video] : [];

    if (Array.isArray(media)) {
      if (imageList.length === 0) imageList = media.filter((m: any) => m.mediaType === "IMAGE" || !m.mediaType);
      if (videoList.length === 0) videoList = media.filter((m: any) => m.mediaType === "VIDEO");
    }

    // Requirements validation when submitting:
    if (submit) {
      if (imageList.length < 1) {
        return NextResponse.json(
          { error: "Evaluation Images required: Please upload at least 1 image (up to 5)." },
          { status: 400 }
        );
      }
      if (videoList.length < 1) {
        return NextResponse.json(
          { error: "Evaluation Video required: Please upload at least 1 video." },
          { status: 400 }
        );
      }
    }

    if (imageList.length > 5) {
      return NextResponse.json(
        { error: "Maximum of 5 Evaluation Images allowed." },
        { status: 400 }
      );
    }

    const combinedMedia = [
      ...imageList.map((img: any) => ({ ...img, mediaType: "IMAGE" as const })),
      ...videoList.map((vid: any) => ({ ...vid, mediaType: "VIDEO" as const })),
    ];

    const updatedRecord: any = await (prisma as any).afterMeetingReport.upsert({
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

    // Synchronize Evaluation Media (Images + Video)
    if (combinedMedia && (combinedMedia.length > 0 || body.images !== undefined || body.video !== undefined || body.media !== undefined)) {
      try {
        await syncEvaluationMedia(updatedRecord.id, combinedMedia);
      } catch (mediaErr) {
        console.warn("Evaluation media sync warning:", mediaErr);
      }
    }

    if (submit) {
      await (prisma as any).meetingReport.update({
        where: { id: meeting.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }

    const actorName = user.username || user.name || "User";
    await (prisma as any).reportAuditLog.create({
      data: {
        meetingReportId: meeting.id,
        actorId: user.id,
        action: submit ? "EVALUATION_SUBMITTED" : "EVALUATION_SAVED",
        details: submit ? `After-Meeting Evaluation Form submitted for review by ${actorName}` : `After-Meeting Evaluation Form draft saved by ${actorName}`,
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
