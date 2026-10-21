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
    const { formType = "VERIFICATION", action, comment } = body;

    const normalizedFormType = (formType as string).toUpperCase();
    if (!["VERIFICATION", "ATTENDANCE", "EVALUATION", "AFTER_MEETING"].includes(normalizedFormType)) {
      return NextResponse.json({ error: "Invalid formType. Must be VERIFICATION, ATTENDANCE, or EVALUATION" }, { status: 400 });
    }
    const targetFormKey = normalizedFormType === "AFTER_MEETING" ? "EVALUATION" : normalizedFormType;

    const normalizedAction = (action as string)?.toUpperCase();
    if (!normalizedAction || !["APPROVE", "FORWARD", "REJECT", "REQUEST_CHANGES"].includes(normalizedAction)) {
      return NextResponse.json({ error: "Invalid action. Must be FORWARD, APPROVE, or REJECT" }, { status: 400 });
    }

    if (["REJECT", "REQUEST_CHANGES"].includes(normalizedAction) && (!comment || !comment.trim())) {
      return NextResponse.json({ error: "Reviewer comment is required for rejection." }, { status: 400 });
    }

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
      include: {
        leader: true,
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const { role } = session.user;

    // Get the current form record and status
    let currentFormRecord: any = null;
    if (targetFormKey === "VERIFICATION") {
      currentFormRecord = report.verificationSheet;
    } else if (targetFormKey === "ATTENDANCE") {
      currentFormRecord = report.attendanceRecord;
    } else if (targetFormKey === "EVALUATION") {
      currentFormRecord = report.afterMeetingReport;
    }

    if (!currentFormRecord) {
      return NextResponse.json({ error: `${targetFormKey} form record not found for this meeting.` }, { status: 404 });
    }

    const currentFormStatus = currentFormRecord.status;

    if (currentFormStatus === "COMPLETED") {
      return NextResponse.json({ error: "Cannot review a form that has already been approved and completed." }, { status: 400 });
    }

    if (currentFormStatus === "PENDING") {
      return NextResponse.json({ error: "Cannot review a form that has not been submitted yet." }, { status: 400 });
    }

    // Role-based validation and stage progression
    let nextFormStatus: any = currentFormStatus;
    let auditAction = "";
    let auditDetails = "";

    if (role === "ZONE_LEADER") {
      const isSameZone = Boolean(session.user.zone && report.leader.zone === session.user.zone);
      if (!isSameZone) {
        return NextResponse.json({ error: "Forbidden: You can only review meetings within your zone." }, { status: 403 });
      }

      if (currentFormStatus !== "SUBMITTED") {
        return NextResponse.json({
          error: `Forbidden: As Zonal Leader, you can only review forms with status SUBMITTED. Current status is ${currentFormStatus}.`,
        }, { status: 403 });
      }

      if (normalizedAction === "FORWARD" || normalizedAction === "APPROVE") {
        nextFormStatus = "FORWARDED_TO_STATE";
        auditAction = `${targetFormKey}_FORWARDED_TO_STATE`;
        auditDetails = `Zonal Leader ${session.user.username} reviewed and forwarded ${targetFormKey} Form to State Leader.`;
      } else {
        nextFormStatus = "REJECTED";
        auditAction = `${targetFormKey}_REJECTED`;
        auditDetails = `Zonal Leader ${session.user.username} rejected ${targetFormKey} Form: "${comment}"`;
      }
    } else if (role === "STATE_LEADER") {
      const isSameState = Boolean(session.user.state && report.leader.state === session.user.state);
      if (!isSameState) {
        return NextResponse.json({ error: "Forbidden: You can only review meetings within your state." }, { status: 403 });
      }

      if (currentFormStatus !== "FORWARDED_TO_STATE") {
        return NextResponse.json({
          error: `Forbidden: As State Leader, you can only review forms that are FORWARDED_TO_STATE. Current status is ${currentFormStatus}.`,
        }, { status: 403 });
      }

      if (normalizedAction === "FORWARD" || normalizedAction === "APPROVE") {
        nextFormStatus = "FORWARDED_TO_ADMIN";
        auditAction = `${targetFormKey}_FORWARDED_TO_ADMIN`;
        auditDetails = `State Leader ${session.user.username} reviewed and forwarded ${targetFormKey} Form to Admin.`;
      } else {
        nextFormStatus = "REJECTED";
        auditAction = `${targetFormKey}_REJECTED`;
        auditDetails = `State Leader ${session.user.username} rejected ${targetFormKey} Form: "${comment}"`;
      }
    } else if (role === "ADMIN") {
      // Admin can review forms waiting for admin, or directly if needed
      if (normalizedAction === "APPROVE" || normalizedAction === "FORWARD") {
        nextFormStatus = "COMPLETED";
        auditAction = `${targetFormKey}_COMPLETED`;
        auditDetails = `Admin ${session.user.username} gave final approval to ${targetFormKey} Form. Marked COMPLETED.`;
      } else {
        nextFormStatus = "REJECTED";
        auditAction = `${targetFormKey}_REJECTED`;
        auditDetails = `Admin ${session.user.username} rejected ${targetFormKey} Form: "${comment}"`;
      }
    } else {
      return NextResponse.json({ error: "Forbidden: You do not have permission to review forms." }, { status: 403 });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Update the individual form's status and timestamps
      if (targetFormKey === "VERIFICATION") {
        await tx.verificationSheet.update({
          where: { meetingReportId: reportId },
          data: {
            status: nextFormStatus,
            approvedAt: nextFormStatus === "COMPLETED" ? now : undefined,
            rejectedAt: nextFormStatus === "REJECTED" ? now : undefined,
          },
        });
      } else if (targetFormKey === "ATTENDANCE") {
        await tx.attendanceRecord.update({
          where: { meetingReportId: reportId },
          data: {
            status: nextFormStatus,
            approvedAt: nextFormStatus === "COMPLETED" ? now : undefined,
            rejectedAt: nextFormStatus === "REJECTED" ? now : undefined,
          },
        });
      } else if (targetFormKey === "EVALUATION") {
        await tx.afterMeetingReport.update({
          where: { meetingReportId: reportId },
          data: {
            status: nextFormStatus,
            approvedAt: nextFormStatus === "COMPLETED" ? now : undefined,
            rejectedAt: nextFormStatus === "REJECTED" ? now : undefined,
          },
        });
      }

      // 2. Save reviewer comment with formType
      if (comment && comment.trim()) {
        await tx.reviewerComment.create({
          data: {
            meetingReportId: reportId,
            reviewerId: session.user.id,
            formType: targetFormKey,
            comment: comment.trim(),
          },
        });
      }

      // 3. Log audit entry with formType
      await tx.reportAuditLog.create({
        data: {
          meetingReportId: reportId,
          actorId: session.user.id,
          action: auditAction,
          details: auditDetails,
          formType: targetFormKey,
        },
      });

      // 4. Update meeting report version and parent status if applicable
      await tx.meetingReport.update({
        where: { id: reportId },
        data: {
          version: report.version + 1,
        },
      });

      // 5. Send notifications
      const notifTitle = `${targetFormKey} Form: ${nextFormStatus.replace(/_/g, " ")}`;
      await tx.notification.create({
        data: {
          recipientId: report.leaderId,
          senderId: session.user.id,
          title: notifTitle,
          message: `${auditDetails}${comment ? ` Comment: "${comment}"` : ""}`,
        },
      });

      // Forwarding notifications
      if (nextFormStatus === "FORWARDED_TO_STATE") {
        const stateLeaders = await tx.user.findMany({
          where: { role: "STATE_LEADER", state: report.leader.state },
        });
        for (const sl of stateLeaders) {
          await tx.notification.create({
            data: {
              recipientId: sl.id,
              senderId: session.user.id,
              title: `Pending Review: ${targetFormKey} Form (${report.reportId})`,
              message: `${report.reportId} ${targetFormKey} Form was forwarded to you for State review by ${session.user.username}.`,
            },
          });
        }
      } else if (nextFormStatus === "FORWARDED_TO_ADMIN") {
        const admins = await tx.user.findMany({
          where: { role: "ADMIN" },
        });
        for (const adminUser of admins) {
          await tx.notification.create({
            data: {
              recipientId: adminUser.id,
              senderId: session.user.id,
              title: `Pending Admin Approval: ${targetFormKey} Form (${report.reportId})`,
              message: `${report.reportId} ${targetFormKey} Form was forwarded to Admin review by ${session.user.username}.`,
            },
          });
        }
      }
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: `${targetFormKey} Form status updated to ${nextFormStatus}`,
      formType: targetFormKey,
      status: nextFormStatus,
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/review error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
