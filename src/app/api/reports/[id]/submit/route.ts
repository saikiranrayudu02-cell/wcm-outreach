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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const formType = (body.formType || "").toUpperCase();

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
    if (report.leaderId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: You do not own this meeting" }, { status: 403 });
    }

    // Determine target forms to submit
    const targetForms: string[] = [];
    if (formType === "VERIFICATION") {
      targetForms.push("VERIFICATION");
    } else if (formType === "ATTENDANCE") {
      targetForms.push("ATTENDANCE");
    } else if (formType === "EVALUATION" || formType === "AFTER_MEETING") {
      targetForms.push("EVALUATION");
    } else if (!formType || formType === "ALL") {
      // Default: submit any unsubmitted forms that are unlocked and complete
      if (report.verificationSheet?.status === "PENDING" || report.verificationSheet?.status === "REJECTED") {
        targetForms.push("VERIFICATION");
      }
      if (report.verificationSheet?.status === "COMPLETED") {
        if (report.attendanceRecord && (report.attendanceRecord.status === "PENDING" || report.attendanceRecord.status === "REJECTED")) {
          targetForms.push("ATTENDANCE");
        }
        if (report.afterMeetingReport && (report.afterMeetingReport.status === "PENDING" || report.afterMeetingReport.status === "REJECTED")) {
          targetForms.push("EVALUATION");
        }
      }
    } else {
      return NextResponse.json({ error: `Invalid formType: ${formType}` }, { status: 400 });
    }

    if (targetForms.length === 0) {
      return NextResponse.json({ error: "No pending or rejected forms found to submit." }, { status: 400 });
    }

    const errors: string[] = [];

    // Lock Enforcement & Field Validation
    const isVerificationApproved = report.verificationSheet?.status === "COMPLETED";

    if (targetForms.includes("ATTENDANCE") && !isVerificationApproved) {
      return NextResponse.json({
        error: "Attendance Form is locked until Verification Form receives final Admin approval.",
      }, { status: 400 });
    }

    if (targetForms.includes("EVALUATION") && !isVerificationApproved) {
      return NextResponse.json({
        error: "After-Meeting Evaluation Form is locked until Verification Form receives final Admin approval.",
      }, { status: 400 });
    }

    // 1. Verification Sheet Validation
    if (targetForms.includes("VERIFICATION")) {
      const v = report.verificationSheet;
      if (!v) {
        errors.push("Verification Sheet is missing.");
      } else {
        if (!v.convenerName?.trim()) errors.push("Convener Name is required.");
        if (!v.churchMinistryName?.trim() || v.churchMinistryName === "Not Specified") {
          errors.push("Church / Ministry Name is required.");
        }
        if (!v.stateDistrictCity?.trim() || v.stateDistrictCity === "Not Specified") {
          errors.push("State / District / City is required.");
        }
        if (!v.contactNumber?.trim() || v.contactNumber === "Not Specified") {
          errors.push("Contact Number is required.");
        }
        if (!v.meetingDates?.trim()) errors.push("Meeting Dates is required.");
        if (v.numberOfDays <= 0) errors.push("Number of Days must be greater than 0.");
        if (v.expectedAttendance <= 0) errors.push("Expected Attendance must be greater than 0.");
      }
    }

    // 2. Attendance Record Validation
    if (targetForms.includes("ATTENDANCE")) {
      const a = report.attendanceRecord;
      if (!a) {
        errors.push("Attendance Record section is missing.");
      } else {
        if (!a.location?.trim()) errors.push("Attendance Location is required.");
        if (!a.fieldExecuter?.trim()) errors.push("Field Executer is required.");
        if (!a.coordinator?.trim()) errors.push("Coordinator Name in Attendance is required.");
        if (a.membersAttended <= 0 && a.pastorsAttended <= 0) {
          errors.push("Attendance count (members or pastors) must be greater than 0.");
        }
        if (!a.remarks?.trim()) errors.push("Remarks are required in Attendance.");
      }
    }

    // 3. After Meeting Report Validation
    if (targetForms.includes("EVALUATION")) {
      const r = report.afterMeetingReport;
      if (!r) {
        errors.push("After Meeting Report section is missing.");
      } else {
        if (!r.overallMeetingOutcome?.trim()) errors.push("Overall Meeting Outcome is required.");
        if (!r.congregationResponse?.trim()) errors.push("Congregation Response is required.");
        if (!r.coordinatorName?.trim()) errors.push("Coordinator Name in After Meeting Report is required.");
        if (!r.designation?.trim()) errors.push("Designation is required.");
        if (!r.signature?.trim()) errors.push("Signature is required.");
        if (!r.strengthsObserved?.trim()) errors.push("Strengths Observed is required.");
        if (!r.challengesObserved?.trim()) errors.push("Challenges Observed is required.");
        if (!r.opportunityForWcm?.trim()) errors.push("Opportunity for WCM is required.");
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: "Validation Failed", details: errors }, { status: 400 });
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Transition submitted forms
      if (targetForms.includes("VERIFICATION") && report.verificationSheet) {
        await tx.verificationSheet.update({
          where: { meetingReportId: reportId },
          data: {
            status: "SUBMITTED",
            submittedAt: now,
            rejectedAt: null,
          },
        });

        await tx.reportAuditLog.create({
          data: {
            meetingReportId: reportId,
            actorId: user.id,
            action: "VERIFICATION_SUBMITTED",
            details: `Verification Form submitted by Coordinator ${user.username}`,
            formType: "VERIFICATION",
          },
        });
      }

      if (targetForms.includes("ATTENDANCE") && report.attendanceRecord) {
        await tx.attendanceRecord.update({
          where: { meetingReportId: reportId },
          data: {
            status: "SUBMITTED",
            submittedAt: now,
            rejectedAt: null,
          },
        });

        await tx.reportAuditLog.create({
          data: {
            meetingReportId: reportId,
            actorId: user.id,
            action: "ATTENDANCE_SUBMITTED",
            details: `Attendance Form submitted by Coordinator ${user.username}`,
            formType: "ATTENDANCE",
          },
        });
      }

      if (targetForms.includes("EVALUATION") && report.afterMeetingReport) {
        await tx.afterMeetingReport.update({
          where: { meetingReportId: reportId },
          data: {
            status: "SUBMITTED",
            submittedAt: now,
            rejectedAt: null,
          },
        });

        await tx.reportAuditLog.create({
          data: {
            meetingReportId: reportId,
            actorId: user.id,
            action: "EVALUATION_SUBMITTED",
            details: `After-Meeting Evaluation Form submitted by Coordinator ${user.username}`,
            formType: "EVALUATION",
          },
        });
      }

      // Update parent meeting report version and status
      await tx.meetingReport.update({
        where: { id: reportId },
        data: {
          status: "SUBMITTED",
          submittedAt: report.submittedAt || now,
          version: report.version + 1,
        },
      });
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: `Form(s) [${targetForms.join(", ")}] submitted successfully`,
      submittedForms: targetForms,
    });
  } catch (err) {
    console.error("POST /api/reports/[id]/submit error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
