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

    const report = await prisma.meetingReport.findUnique({
      where: { id: reportId },
      include: {
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const user = session.user as any;
    if (report.leaderId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You do not own this report" }, { status: 403 });
    }

    if (report.status !== "DRAFT" && report.status !== "REQUEST_CHANGES") {
      return NextResponse.json({ error: "Only draft or returned reports can be submitted" }, { status: 400 });
    }

    // Validation checks for each section
    const errors: string[] = [];

    // 1. Verification Sheet Validation
    const v = report.verificationSheet;
    if (!v) {
      errors.push("Verification Sheet section is missing.");
    } else {
      if (!v.convenerName.trim()) errors.push("Convener Name is required.");
      if (!v.churchMinistryName.trim() || v.churchMinistryName === "Not Specified") {
        errors.push("Church / Ministry Name is required.");
      }
      if (!v.stateDistrictCity.trim() || v.stateDistrictCity === "Not Specified") {
        errors.push("State / District / City is required.");
      }
      if (!v.contactNumber.trim() || v.contactNumber === "Not Specified") {
        errors.push("Contact Number is required.");
      }
      if (!v.meetingDates.trim()) errors.push("Meeting Dates is required.");
      if (v.numberOfDays <= 0) errors.push("Number of Days must be greater than 0.");
      if (v.expectedAttendance <= 0) errors.push("Expected Attendance must be greater than 0.");
    }

    // 2. Attendance Record Validation
    const a = report.attendanceRecord;
    if (!a) {
      errors.push("Attendance Record section is missing.");
    } else {
      if (!a.location.trim()) errors.push("Attendance Location is required.");
      if (!a.fieldExecuter.trim()) errors.push("Field Executer is required.");
      if (!a.coordinator.trim()) errors.push("Coordinator Name in Attendance is required.");
      if (a.membersAttended <= 0 && a.pastorsAttended <= 0) {
        errors.push("Attendance count (members or pastors) must be greater than 0.");
      }
      if (!a.remarks.trim()) errors.push("Remarks are required in Attendance.");
    }

    // 3. After Meeting Report Validation
    const r = report.afterMeetingReport;
    if (!r) {
      errors.push("After Meeting Report section is missing.");
    } else {
      if (!r.overallMeetingOutcome.trim()) errors.push("Overall Meeting Outcome is required.");
      if (!r.congregationResponse.trim()) errors.push("Congregation Response is required.");
      if (!r.coordinatorName.trim()) errors.push("Coordinator Name in After Meeting Report is required.");
      if (!r.designation.trim()) errors.push("Designation is required.");
      if (!r.signature.trim()) errors.push("Signature is required.");
      if (!r.strengthsObserved.trim()) errors.push("Strengths Observed is required.");
      if (!r.challengesObserved.trim()) errors.push("Challenges Observed is required.");
      if (!r.opportunityForWcm.trim()) errors.push("Opportunity for WCM is required.");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation Failed", details: errors }, { status: 400 });
    }

    // Transition Status Logic
    let nextStatus: any = "SUBMITTED";
    let auditAction = "REPORT_SUBMITTED";
    let auditDetails = `Meeting Report ${report.reportId} submitted for approval.`;

    if (report.status === "REQUEST_CHANGES") {
      auditAction = "REPORT_RESUBMITTED";
      if (report.requestedChangesBy === "STATE") {
        nextStatus = "STATE_LEADER_REVIEW";
        auditDetails = `Meeting Report ${report.reportId} resubmitted directly to State Leader Review.`;
      } else if (report.requestedChangesBy === "ADMIN") {
        nextStatus = "ADMIN_REVIEW";
        auditDetails = `Meeting Report ${report.reportId} resubmitted directly to Admin Review.`;
      } else {
        nextStatus = "SUBMITTED";
        auditDetails = `Meeting Report ${report.reportId} resubmitted to Zone Leader Review.`;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.meetingReport.update({
        where: { id: reportId },
        data: {
          status: nextStatus,
          submittedAt: new Date(),
          version: report.version + 1, // Increment version on resubmission
          requestedChangesBy: null, // Clear reviewer tag
        },
      });

      await tx.reportAuditLog.create({
        data: {
          meetingReportId: reportId,
          actorId: user.id,
          action: auditAction,
          details: auditDetails,
        },
      });

      return updatedReport;
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: "Report Submitted Successfully",
      status: updated.status,
      version: updated.version,
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/submit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
