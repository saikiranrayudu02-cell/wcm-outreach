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

    const role = (session.user as any).role;
    if (role !== "COORDINATOR" && role !== "LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { title, meetingId: customMeetingId } = body;

    // Generate unique report ID (MR-YYYY-XXXXX or custom meetingId) safely
    const year = new Date().getFullYear();
    let reportId = "";

    if (customMeetingId && typeof customMeetingId === "string" && customMeetingId.trim().length > 0) {
      const sanitized = customMeetingId.trim().toUpperCase();
      const existing = await prisma.meetingReport.findUnique({ where: { reportId: sanitized } });
      if (existing) {
        return NextResponse.json({ error: `Meeting ID "${sanitized}" already exists.` }, { status: 409 });
      }
      reportId = sanitized;
    } else {
      let attempts = 0;
      while (attempts < 5) {
        const count = await prisma.meetingReport.count();
        const candidateId = attempts === 0
          ? `MR-${year}-${String(count + 1).padStart(5, "0")}`
          : `MR-${year}-${String(count + 1).padStart(5, "0")}-${Math.floor(100 + Math.random() * 900)}`;

        const exists = await prisma.meetingReport.findUnique({ where: { reportId: candidateId } });
        if (!exists) {
          reportId = candidateId;
          break;
        }
        attempts++;
      }

      if (!reportId) {
        reportId = `MR-${year}-${Date.now().toString().slice(-6)}`;
      }
    }

    const report = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.meetingReport.create({
        data: {
          reportId,
          title: title?.trim() || `Outreach Meeting ${reportId}`,
          leaderId: user.id,
          status: "DRAFT",
          version: 1,
        },
      });

      // Initialize Verification Sheet in PENDING status
      await tx.verificationSheet.create({
        data: {
          meetingReportId: createdReport.id,
          status: "PENDING",
          convenerName: "",
          churchMinistryName: "",
          stateDistrictCity: "",
          contactNumber: "",
          meetingDates: "",
          numberOfDays: 1,
          expectedAttendance: 0,
          yearsOfMinistry: 0,
          churchMembers: 0,
          workersLeaders: 0,
          knowAboutWcm: "",
          readWcmBooks: false,
          attendedProphetMeeting: false,
          meetingHallStage: "",
          soundSystem: "",
          accommodationTeam: "",
          volunteerSupport: "",
        },
      });

      await tx.reportAuditLog.create({
        data: {
          meetingReportId: createdReport.id,
          actorId: user.id,
          action: "MEETING_CREATED",
          details: `Meeting ${reportId} created by Coordinator ${user.username}`,
          formType: "MEETING",
        },
      });

      return createdReport;
    }, { maxWait: 20000, timeout: 30000 });

    return NextResponse.json({
      message: "Meeting Created Successfully",
      id: report.id,
      reportId: report.reportId,
      title: report.title,
    });
  } catch (err) {
    console.error("POST /api/reports/create error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
