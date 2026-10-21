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

    const user = session.user as any;
    const body = await request.json();
    const { meetingId, submit = false, ...aData } = body;

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId is required to associate Attendance Form with a meeting." }, { status: 400 });
    }

    const meeting = await prisma.meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
        leaderId: user.role === "ADMIN" ? undefined : user.id,
      },
      include: {
        verificationSheet: true,
        attendanceRecord: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found or you are not authorized" }, { status: 404 });
    }

    // Strict Lock Enforcement: Attendance Form is locked until Verification Form receives final Admin approval
    if (meeting.verificationSheet?.status !== "COMPLETED") {
      return NextResponse.json({
        error: "Attendance Form is locked until Verification Form receives final Admin approval.",
      }, { status: 400 });
    }

    const updatedRecord = await prisma.attendanceRecord.upsert({
      where: { meetingReportId: meeting.id },
      create: {
        meetingReportId: meeting.id,
        status: submit ? "SUBMITTED" : "PENDING",
        submittedAt: submit ? new Date() : undefined,
        date: aData.date ? new Date(aData.date) : new Date(),
        location: aData.location || "",
        fieldExecuter: aData.fieldExecuter || "",
        coordinator: aData.coordinator || "",
        membersAttended: aData.membersAttended !== undefined ? Number(aData.membersAttended) : 0,
        pastorsAttended: aData.pastorsAttended !== undefined ? Number(aData.pastorsAttended) : 0,
        remarks: aData.remarks || "",
      },
      update: {
        status: submit ? "SUBMITTED" : undefined,
        submittedAt: submit ? new Date() : undefined,
        date: aData.date ? new Date(aData.date) : undefined,
        location: aData.location,
        fieldExecuter: aData.fieldExecuter,
        coordinator: aData.coordinator,
        membersAttended: aData.membersAttended !== undefined ? Number(aData.membersAttended) : undefined,
        pastorsAttended: aData.pastorsAttended !== undefined ? Number(aData.pastorsAttended) : undefined,
        remarks: aData.remarks,
      },
    });

    await prisma.reportAuditLog.create({
      data: {
        meetingReportId: meeting.id,
        actorId: user.id,
        action: submit ? "ATTENDANCE_SUBMITTED" : "ATTENDANCE_SAVED",
        details: submit ? "Attendance Form submitted for review" : "Attendance Form draft saved",
        formType: "ATTENDANCE",
      },
    });

    return NextResponse.json({
      message: submit ? "Attendance Form submitted successfully" : "Attendance Form saved successfully",
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: updatedRecord.status,
    });
  } catch (err) {
    console.error("POST /api/reports/attendance error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
