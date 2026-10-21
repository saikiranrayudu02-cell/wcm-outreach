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

    const { role, state, part, zone, id: userId } = session.user;

    let whereClause: any = {};

    if (role === "COORDINATOR" || role === "LEADER") {
      // Coordinator can see all of their own meetings (Drafts, Submitted, etc.)
      whereClause = { leaderId: userId };
    } else if (role === "ZONE_LEADER") {
      if (!zone) {
        return NextResponse.json([]);
      }
      whereClause = {
        leader: { zone: zone },
        OR: [
          { status: { not: "DRAFT" } },
          { verificationSheet: { status: { not: "PENDING" } } },
          { attendanceRecord: { status: { not: "PENDING" } } },
          { afterMeetingReport: { status: { not: "PENDING" } } },
        ],
      };
    } else if (role === "STATE_LEADER") {
      if (!state) {
        return NextResponse.json([]);
      }
      whereClause = {
        leader: { state: state },
        OR: [
          { status: { not: "DRAFT" } },
          { verificationSheet: { status: { not: "PENDING" } } },
          { attendanceRecord: { status: { not: "PENDING" } } },
          { afterMeetingReport: { status: { not: "PENDING" } } },
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

    const dbReports = await prisma.meetingReport.findMany({
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
            status: true,
            convenerName: true,
            churchMinistryName: true,
            stateDistrictCity: true,
            meetingDates: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
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
    const reports = dbReports.map((r) => {
      const vStatus = r.verificationSheet?.status || "PENDING";
      const aStatus = r.attendanceRecord?.status || "PENDING";
      const rStatus = r.afterMeetingReport?.status || "PENDING";

      const isAttendanceLocked = vStatus !== "COMPLETED";
      const isEvaluationLocked = vStatus !== "COMPLETED";

      const lastAudit = r.auditLogs?.[0];
      const forwardedByText = lastAudit
        ? `${lastAudit.actor?.username || "Leader"} (${lastAudit.actor?.role?.replace(/_/g, " ") || ""})`
        : null;

      return {
        id: r.id,
        reportId: r.reportId,
        title: r.title || `Outreach Meeting ${r.reportId}`,
        submissionDate: r.submittedAt || r.createdAt,
        coordinatorName: r.verificationSheet?.convenerName || r.leader.name || r.leader.username,
        status: r.status,
        rawStatus: r.status,
        version: r.version,
        leader: r.leader,
        verificationStatus: vStatus,
        attendanceStatus: aStatus,
        evaluationStatus: rStatus,
        isAttendanceLocked,
        isEvaluationLocked,
        meetingDates: r.verificationSheet?.meetingDates || "N/A",
        location: r.attendanceRecord?.location || r.verificationSheet?.stateDistrictCity || "N/A",
        forwardedBy: forwardedByText,
        lastAuditDetails: lastAudit?.details || null,
        auditLogs: r.auditLogs,
      };
    });

    return NextResponse.json(reports);
  } catch (err) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
