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
      // Coordinator can see all of their own reports (Drafts, Submitted, etc.)
      whereClause = { leaderId: userId };
    } else if (role === "ZONE_LEADER") {
      if (!zone) {
        return NextResponse.json([]);
      }
      // Zone Leader can see all submitted/reviewed reports in their zone, but NEVER drafts.
      whereClause = {
        leader: { zone: zone },
        status: {
          not: "DRAFT",
        },
      };
    } else if (role === "STATE_LEADER") {
      if (!state) {
        return NextResponse.json([]);
      }
      // State Leader can see all submitted/forwarded/reviewed reports from their state
      whereClause = {
        leader: { state: state },
        status: {
          not: "DRAFT",
        },
      };
    } else if (role === "ADMIN") {
      // Admin can see ALL submitted/forwarded/reviewed reports across all zones & states in the system
      whereClause = {
        status: {
          not: "DRAFT",
        },
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
            role: true,
            state: true,
            part: true,
            zone: true,
          },
        },
        verificationSheet: {
          select: {
            convenerName: true,
            churchMinistryName: true,
            meetingDates: true,
          },
        },
        attendanceRecord: {
          select: {
            location: true,
            date: true,
          },
        },
        afterMeetingReport: {
          select: {
            coordinatorName: true,
            submissionDate: true,
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

    // Format for consumption by dashboards
    const reports = dbReports.map((r) => {
      let displayStatus = "";
      switch (r.status) {
        case "DRAFT":
          displayStatus = "Draft";
          break;
        case "SUBMITTED":
          displayStatus = "Submitted (Pending Review)";
          break;
        case "ZONE_LEADER_REVIEW":
          displayStatus = "Under Zone Leader Review";
          break;
        case "STATE_LEADER_REVIEW":
          displayStatus = "Under State Leader Review";
          break;
        case "ADMIN_REVIEW":
          displayStatus = "Under Admin Review";
          break;
        case "STATE_AND_ADMIN_REVIEW":
          displayStatus = "Under State & Admin Review";
          break;
        case "APPROVED":
          displayStatus = "Approved";
          break;
        case "REQUEST_CHANGES":
          displayStatus = "Request Changes (Returned)";
          break;
        default:
          displayStatus = r.status;
      }

      const lastAudit = r.auditLogs?.[0];
      const forwardedByText = lastAudit
        ? `${lastAudit.actor?.username || "Leader"} (${lastAudit.actor?.role?.replace(/_/g, " ") || ""})`
        : null;

      return {
        id: r.id,
        reportId: r.reportId,
        submissionDate: r.submittedAt || r.createdAt,
        coordinatorName: r.verificationSheet?.convenerName || r.leader.username,
        status: displayStatus,
        rawStatus: r.status,
        version: r.version,
        leader: r.leader,
        meetingDates: r.verificationSheet?.meetingDates || "N/A",
        location: r.attendanceRecord?.location || "N/A",
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
