import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, state: userState, part: userPart, zone: userZone, id: userId } = session.user as any;

    const { searchParams } = new URL(request.url);
    const filterState = searchParams.get("state") || undefined;
    const filterZone = searchParams.get("zone") || undefined;
    const filterDistrict = searchParams.get("district") || undefined;
    const filterPart = searchParams.get("part") || undefined;

    let whereClause: any = {};

    if (role === "COORDINATOR" || role === "LEADER") {
      whereClause = { leaderId: userId };
    } else if (role === "ZONE_LEADER") {
      if (!userZone) return NextResponse.json([]);
      whereClause = {
        OR: [
          { leader: { zone: userZone } },
          { verificationSheet: { zone: userZone } },
        ],
        AND: [
          {
            OR: [
              { status: { not: "DRAFT" } },
              { verificationSheet: { status: { not: "PENDING" } } },
              { attendanceRecord: { status: { not: "PENDING" } } },
              { afterMeetingReport: { status: { not: "PENDING" } } },
            ],
          },
        ],
      };
    } else if (role === "STATE_LEADER") {
      if (!userState) return NextResponse.json([]);
      whereClause = {
        OR: [
          { leader: { state: userState } },
          { verificationSheet: { state: userState } },
        ],
        AND: [
          {
            OR: [
              { status: { not: "DRAFT" } },
              { verificationSheet: { status: { not: "PENDING" } } },
              { attendanceRecord: { status: { not: "PENDING" } } },
              { afterMeetingReport: { status: { not: "PENDING" } } },
            ],
          },
        ],
      };
    } else if (role === "ADMIN") {
      whereClause = {
        OR: [
          { status: { not: "DRAFT" } },
          { verificationSheet: { status: { not: "PENDING" } } },
          { attendanceRecord: { status: { not: "PENDING" } } },
          { afterMeetingReport: { status: { not: "PENDING" } } },
        ],
      };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Apply Hierarchical Geographic Filters if requested
    const effectiveState = role === "STATE_LEADER" ? userState : filterState;
    const effectiveZone = role === "ZONE_LEADER" ? userZone : filterZone;

    const andConditions: any[] = [];

    if (effectiveState) {
      andConditions.push({
        OR: [
          { verificationSheet: { state: effectiveState } },
          { leader: { state: effectiveState } },
        ],
      });
    }

    if (effectiveZone) {
      andConditions.push({
        OR: [
          { verificationSheet: { zone: effectiveZone } },
          { leader: { zone: effectiveZone } },
        ],
      });
    }

    if (filterDistrict) {
      andConditions.push({
        verificationSheet: { district: filterDistrict },
      });
    }

    if (filterPart) {
      andConditions.push({
        OR: [
          { verificationSheet: { part: filterPart } },
          { leader: { part: filterPart } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause = {
        AND: [whereClause, ...andConditions],
      };
    }

    const db = prisma as any;

    const dbReports = await db.meetingReport.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            username: true,
            name: true,
            role: true,
            state: true,
            part: true,
            zone: true,
          },
        },
        verificationSheet: {
          select: {
            id: true,
            status: true,
            convenerName: true,
            churchMinistryName: true,
            stateDistrictCity: true,
            state: true,
            zone: true,
            district: true,
            part: true,
            isCallLocked: true,
            callLockedReason: true,
            callAnsweredAt: true,
            contactNumber: true,
            meetingDates: true,
            numberOfDays: true,
            expectedAttendance: true,
            meetingSession: true,
            travelMode: true,
            travelOtherDetails: true,
            stayLocation: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            media: true,
            callAttempts: {
              select: {
                id: true,
                status: true,
                duration: true,
                durationFormatted: true,
                recordingUrl: true,
                transcript: true,
                attemptNumber: true,
                createdAt: true,
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
        attendanceRecord: {
          select: {
            status: true,
            location: true,
            date: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
          },
        },
        afterMeetingReport: {
          select: {
            status: true,
            coordinatorName: true,
            submissionDate: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            media: true,
          },
        },
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
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format for consumption by meeting-wise dashboards
    const reports = dbReports.map((r: any) => {
      const vStatus = r.verificationSheet?.status || "PENDING";
      const aStatus = r.attendanceRecord?.status || "PENDING";
      const rStatus = r.afterMeetingReport?.status || "PENDING";

      const isAttendanceLocked = vStatus !== "COMPLETED";
      const isEvaluationLocked = vStatus !== "COMPLETED";

      const lastAudit = r.auditLogs?.[0];
      const forwardedByText = lastAudit
        ? `${lastAudit.actor?.username || "Leader"} (${lastAudit.actor?.role?.replace(/_/g, " ") || ""})`
        : null;

      const sheet = r.verificationSheet;

      return {
        id: r.id,
        reportId: r.reportId,
        title: r.title || `Outreach Meeting ${r.reportId}`,
        submissionDate: r.submittedAt || r.createdAt,
        coordinatorName: sheet?.convenerName || r.leader.name || r.leader.username,
        status: r.status,
        rawStatus: r.status,
        version: r.version,
        leader: r.leader,
        verificationStatus: vStatus,
        attendanceStatus: aStatus,
        evaluationStatus: rStatus,
        isAttendanceLocked,
        isEvaluationLocked,
        meetingDates: sheet?.meetingDates || "N/A",
        location: r.attendanceRecord?.location || sheet?.stateDistrictCity || "N/A",
        state: sheet?.state || r.leader?.state || "Location Not Assigned",
        zone: sheet?.zone || r.leader?.zone || "General Zone",
        district: sheet?.district || "General District",
        part: sheet?.part || r.leader?.part || "General Unit",
        isCallLocked: Boolean(sheet?.isCallLocked),
        callLockedReason: sheet?.callLockedReason || null,
        callAnsweredAt: sheet?.callAnsweredAt || null,
        verificationSheetId: sheet?.id || null,
        callAttempts: sheet?.callAttempts || [],
        forwardedBy: forwardedByText,
        lastAuditDetails: lastAudit?.details || null,
        auditLogs: r.auditLogs,
        verification: sheet,
        verificationSheet: sheet,
        report: r.afterMeetingReport,
        afterMeetingReport: r.afterMeetingReport,
      };
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
