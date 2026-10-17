import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await props.params;

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
      include: {
        leader: {
          select: {
            username: true,
            role: true,
            state: true,
            part: true,
            zone: true,
            name: true,
          },
        },
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
        auditLogs: {
          include: {
            actor: {
              select: {
                username: true,
                role: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        reviewerComments: {
          include: {
            reviewer: {
              select: {
                username: true,
                role: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { role } = session.user;
    let allowed = false;

    if (role === "ADMIN") {
      allowed = report.status !== "DRAFT";
    } else if (role === "STATE_LEADER") {
      allowed = report.leader.state === session.user.state && report.status !== "DRAFT";
    } else if (role === "ZONE_LEADER") {
      allowed = report.leader.zone === session.user.zone && report.status !== "DRAFT";
    } else if (session.user.id === report.leaderId) {
      allowed = true;
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transition status to ZONE_LEADER_REVIEW if viewed by the respective Zone Leader first time
    if (role === "ZONE_LEADER" && report.status === "SUBMITTED") {
      await prisma.$transaction(async (tx) => {
        await tx.meetingReport.update({
          where: { id: reportId },
          data: { status: "ZONE_LEADER_REVIEW" },
        });

        await tx.reportAuditLog.create({
          data: {
            meetingReportId: reportId,
            actorId: session.user.id,
            action: "REVIEW_STARTED",
            details: `Zone Leader ${session.user.username} started review`,
          },
        });
      }, { maxWait: 20000, timeout: 30000 });

      report.status = "ZONE_LEADER_REVIEW";
    }

    return NextResponse.json({
      id: report.id,
      reportId: report.reportId,
      status: report.status,
      version: report.version,
      submittedAt: report.submittedAt,
      leader: report.leader,
      verification: report.verificationSheet,
      attendance: report.attendanceRecord,
      report: report.afterMeetingReport,
      auditLogs: report.auditLogs,
      reviewerComments: report.reviewerComments,
    });
  } catch (err) {
    console.error("GET /api/reports/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await props.params;

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
      include: {
        leader: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const user = session.user as any;
    const isOwner = report.leaderId === user.id;
    const isZoneLeader = user.role === "ZONE_LEADER" && report.leader.zone === user.zone;
    const isAdmin = user.role === "ADMIN";

    if (!isOwner && !isZoneLeader && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not have permission to edit this report" }, { status: 403 });
    }

    if (isOwner && !isZoneLeader && !isAdmin) {
      if (report.status !== "DRAFT" && report.status !== "REQUEST_CHANGES") {
        return NextResponse.json({ error: "Cannot edit reports that are submitted or approved" }, { status: 400 });
      }
    } else if (isZoneLeader && !isAdmin) {
      if (!["SUBMITTED", "ZONE_LEADER_REVIEW", "REQUEST_CHANGES", "DRAFT"].includes(report.status)) {
        return NextResponse.json({ error: "Cannot edit reports that are already forwarded or approved" }, { status: 400 });
      }
    }

    const body = await request.json();
    const { verification: vData, attendance: aData, report: rData } = body;

    await prisma.$transaction(async (tx) => {
      // 1. Update/Create VerificationSheet
      if (vData) {
        await tx.verificationSheet.upsert({
          where: { meetingReportId: reportId },
          create: {
            meetingReportId: reportId,
            convenerName: vData.convenerName || "",
            churchMinistryName: vData.churchMinistryName || "",
            stateDistrictCity: vData.stateDistrictCity || "",
            contactNumber: vData.contactNumber || "",
            meetingDates: vData.meetingDates || "",
            numberOfDays: vData.numberOfDays !== undefined ? Number(vData.numberOfDays) : 0,
            expectedAttendance: vData.expectedAttendance !== undefined ? Number(vData.expectedAttendance) : 0,
            yearsOfMinistry: vData.yearsOfMinistry !== undefined ? Number(vData.yearsOfMinistry) : 0,
            churchMembers: vData.churchMembers !== undefined ? Number(vData.churchMembers) : 0,
            workersLeaders: vData.workersLeaders !== undefined ? Number(vData.workersLeaders) : 0,
            knowAboutWcm: vData.knowAboutWcm || "",
            readWcmBooks: vData.readWcmBooks === true || vData.readWcmBooks === "true",
            attendedProphetMeeting: vData.attendedProphetMeeting === true || vData.attendedProphetMeeting === "true",
            meetingHallStage: vData.meetingHallStage || "",
            soundSystem: vData.soundSystem || "",
            accommodationTeam: vData.accommodationTeam || "",
            volunteerSupport: vData.volunteerSupport || "",
          },
          update: {
            convenerName: vData.convenerName,
            churchMinistryName: vData.churchMinistryName,
            stateDistrictCity: vData.stateDistrictCity,
            contactNumber: vData.contactNumber,
            meetingDates: vData.meetingDates,
            numberOfDays: vData.numberOfDays !== undefined ? Number(vData.numberOfDays) : undefined,
            expectedAttendance: vData.expectedAttendance !== undefined ? Number(vData.expectedAttendance) : undefined,
            yearsOfMinistry: vData.yearsOfMinistry !== undefined ? Number(vData.yearsOfMinistry) : undefined,
            churchMembers: vData.churchMembers !== undefined ? Number(vData.churchMembers) : undefined,
            workersLeaders: vData.workersLeaders !== undefined ? Number(vData.workersLeaders) : undefined,
            knowAboutWcm: vData.knowAboutWcm,
            readWcmBooks: vData.readWcmBooks === true || vData.readWcmBooks === "true",
            attendedProphetMeeting: vData.attendedProphetMeeting === true || vData.attendedProphetMeeting === "true",
            meetingHallStage: vData.meetingHallStage,
            soundSystem: vData.soundSystem,
            accommodationTeam: vData.accommodationTeam,
            volunteerSupport: vData.volunteerSupport,
          },
        });
      }

      // 2. Update/Create AttendanceRecord
      if (aData) {
        await tx.attendanceRecord.upsert({
          where: { meetingReportId: reportId },
          create: {
            meetingReportId: reportId,
            date: aData.date ? new Date(aData.date) : new Date(),
            location: aData.location || "",
            fieldExecuter: aData.fieldExecuter || "",
            coordinator: aData.coordinator || "",
            membersAttended: aData.membersAttended !== undefined ? Number(aData.membersAttended) : 0,
            pastorsAttended: aData.pastorsAttended !== undefined ? Number(aData.pastorsAttended) : 0,
            remarks: aData.remarks || "",
          },
          update: {
            date: aData.date ? new Date(aData.date) : undefined,
            location: aData.location,
            fieldExecuter: aData.fieldExecuter,
            coordinator: aData.coordinator,
            membersAttended: aData.membersAttended !== undefined ? Number(aData.membersAttended) : undefined,
            pastorsAttended: aData.pastorsAttended !== undefined ? Number(aData.pastorsAttended) : undefined,
            remarks: aData.remarks,
          },
        });
      }

      // 3. Update/Create AfterMeetingReport
      if (rData) {
        await tx.afterMeetingReport.upsert({
          where: { meetingReportId: reportId },
          create: {
            meetingReportId: reportId,
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
      }

      // Log the update action
      const auditAction = isZoneLeader ? "ZONE_LEADER_EDITED" : "DRAFT_SAVED";
      const auditDetails = isZoneLeader
        ? `Zone Leader ${user.username} edited and corrected the report details.`
        : `Draft fields updated by coordinator.`;

      await tx.reportAuditLog.create({
        data: {
          meetingReportId: reportId,
          actorId: user.id,
          action: auditAction,
          details: auditDetails,
        },
      });
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({ message: "Report draft updated successfully" });
  } catch (err) {
    console.error("PUT /api/reports/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: reportId } = await props.params;

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const user = session.user as any;
    if (report.leaderId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this report" }, { status: 403 });
    }

    if (report.status !== "DRAFT") {
      return NextResponse.json({ error: "Only draft reports can be deleted" }, { status: 400 });
    }

    await prisma.meetingReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/reports/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

