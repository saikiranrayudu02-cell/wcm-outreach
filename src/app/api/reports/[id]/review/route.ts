import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
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
    const body = await request.json();
    const { action, comment, forwardTo } = body;

    if (!action || !["APPROVE", "REQUEST_CHANGES", "REJECT"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (["REQUEST_CHANGES", "REJECT"].includes(action) && (!comment || !comment.trim())) {
      return NextResponse.json({ error: "Reviewer comment is required for rejection or requesting changes" }, { status: 400 });
    }

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
      include: {
        leader: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status === "APPROVED" || report.status === "REJECTED") {
      return NextResponse.json({ error: "Cannot review a report that has already been finalized (Approved or Rejected)" }, { status: 400 });
    }

    if (report.status === "DRAFT") {
      return NextResponse.json({ error: "Draft reports cannot be reviewed until submitted by the coordinator" }, { status: 400 });
    }

    const { role } = session.user;
    let allowed = false;

    // Validate if user has permissions for this report's current stage
    if (role === "ZONE_LEADER") {
      const isSameZone = Boolean(session.user.zone && report.leader.zone === session.user.zone);
      const isZoneStage = ["SUBMITTED", "ZONE_LEADER_REVIEW"].includes(report.status);
      allowed = isSameZone && isZoneStage;
    } else if (role === "STATE_LEADER") {
      const isSameState = Boolean(session.user.state && report.leader.state === session.user.state);
      const isStateStage = ["STATE_LEADER_REVIEW", "STATE_AND_ADMIN_REVIEW"].includes(report.status);
      allowed = isSameState && isStateStage;
    } else if (role === "ADMIN") {
      allowed = ["ADMIN_REVIEW", "STATE_AND_ADMIN_REVIEW", "STATE_LEADER_REVIEW", "ZONE_LEADER_REVIEW", "SUBMITTED"].includes(report.status);
    }

    if (!allowed) {
      return NextResponse.json({ error: "Forbidden: You cannot review this report at its current stage" }, { status: 403 });
    }

    // Determine new status and audit log details
    let nextStatus: any = report.status;
    let reviewerTag = "";
    let auditAction = "";
    let auditDetails = "";

    if (action === "APPROVE") {
      if (role === "ZONE_LEADER") {
        if (forwardTo === "ADMIN") {
          nextStatus = "ADMIN_REVIEW";
          auditAction = "ZONE_LEADER_APPROVED";
          auditDetails = `Zone Leader ${session.user.username} approved the report and manually forwarded it directly to Admin Review.`;
        } else if (forwardTo === "BOTH") {
          nextStatus = "STATE_AND_ADMIN_REVIEW";
          auditAction = "ZONE_LEADER_APPROVED";
          auditDetails = `Zone Leader ${session.user.username} approved the report and manually forwarded it to both State Leader and Admin Review.`;
        } else {
          nextStatus = "STATE_LEADER_REVIEW";
          auditAction = "ZONE_LEADER_APPROVED";
          auditDetails = `Zone Leader ${session.user.username} approved the report and manually forwarded it to State Leader Review.`;
        }
      } else if (role === "STATE_LEADER") {
        nextStatus = "ADMIN_REVIEW";
        auditAction = "STATE_LEADER_APPROVED";
        auditDetails = `State Leader ${session.user.username} approved the report and forwarded it to Admin Review.`;
      } else if (role === "ADMIN") {
        nextStatus = "APPROVED";
        auditAction = "ADMIN_APPROVED";
        auditDetails = `Admin approved the report. Status set to Approved.`;
      }
    } else if (action === "REQUEST_CHANGES") {
      nextStatus = "REQUEST_CHANGES";
      reviewerTag = role === "ZONE_LEADER" ? "ZONE" : role === "STATE_LEADER" ? "STATE" : "ADMIN";
      auditAction = "CHANGES_REQUESTED";
      auditDetails = `Reviewer (${role}) requested changes: "${comment}"`;
    } else if (action === "REJECT") {
      nextStatus = "REJECTED";
      auditAction = "REPORT_REJECTED";
      auditDetails = `Reviewer (${role}) rejected the report: "${comment}"`;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update report status and version
      const updatedReport = await tx.meetingReport.update({
        where: { id: reportId },
        data: {
          status: nextStatus,
          requestedChangesBy: action === "REQUEST_CHANGES" ? reviewerTag : null,
          version: report.version + 1, // Every major review action increments the version
        },
      });

      // 2. Save reviewer comment if present
      if (comment && comment.trim()) {
        await tx.reviewerComment.create({
          data: {
            meetingReportId: reportId,
            reviewerId: session.user.id,
            comment: comment.trim(),
          },
        });
      }

      // 3. Log audit action
      await tx.reportAuditLog.create({
        data: {
          meetingReportId: reportId,
          actorId: session.user.id,
          action: auditAction,
          details: auditDetails,
        },
      });

      // 4. Send notifications based on action and destination
      if (action === "APPROVE" && role === "ZONE_LEADER") {
        const title = `Report Forwarded: ${report.reportId}`;
        const targetDesc = forwardTo === "BOTH" ? "State Leader and Admin" : forwardTo === "ADMIN" ? "Admin" : "State Leader";
        
        // Notify Author / Coordinator
        await tx.notification.create({
          data: {
            recipientId: report.leaderId,
            senderId: session.user.id,
            title: "Report Approved by Zone Leader",
            message: `Your report ${report.reportId} was approved by Zone Leader and manually forwarded to ${targetDesc}.`,
          },
        });

        // Notify State Leaders if destination is STATE_LEADER or BOTH
        if (forwardTo === "STATE_LEADER" || forwardTo === "BOTH") {
          const stateLeaders = await tx.user.findMany({
            where: { role: "STATE_LEADER", state: report.leader.state },
          });
          for (const sl of stateLeaders) {
            await tx.notification.create({
              data: {
                recipientId: sl.id,
                senderId: session.user.id,
                title,
                message: `Meeting Report ${report.reportId} has been forwarded to you for State Leader review by Zone Leader ${session.user.username}.`,
              },
            });
          }
        }

        // Notify Admins if destination is ADMIN or BOTH
        if (forwardTo === "ADMIN" || forwardTo === "BOTH") {
          const admins = await tx.user.findMany({
            where: { role: "ADMIN" },
          });
          for (const adminUser of admins) {
            await tx.notification.create({
              data: {
                recipientId: adminUser.id,
                senderId: session.user.id,
                title,
                message: `Meeting Report ${report.reportId} has been forwarded to Admin review by Zone Leader ${session.user.username}.`,
              },
            });
          }
        }
      }

      return updatedReport;
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: `Report ${action.toLowerCase()}d successfully`,
      status: updated.status,
      version: updated.version,
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/review error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
