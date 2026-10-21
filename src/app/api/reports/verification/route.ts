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
    const { meetingId, submit = false, ...vData } = body;

    let meeting: any = null;

    if (meetingId) {
      meeting = await prisma.meetingReport.findFirst({
        where: {
          OR: [{ id: meetingId }, { reportId: meetingId }],
          leaderId: user.role === "ADMIN" ? undefined : user.id,
        },
        include: { verificationSheet: true },
      });

      if (!meeting) {
        return NextResponse.json({ error: "Meeting not found or you are not authorized" }, { status: 404 });
      }
    } else {
      // Create a new meeting for this verification sheet
      const year = new Date().getFullYear();
      const count = await prisma.meetingReport.count();
      const reportId = `MR-${year}-${String(count + 1).padStart(5, "0")}`;

      meeting = await prisma.meetingReport.create({
        data: {
          reportId,
          title: vData.churchMinistryName ? `${vData.churchMinistryName} Outreach` : `Outreach Meeting ${reportId}`,
          leaderId: user.id,
          status: "DRAFT",
          version: 1,
        },
      });
    }

    // Upsert verification sheet
    const updatedSheet = await prisma.verificationSheet.upsert({
      where: { meetingReportId: meeting.id },
      create: {
        meetingReportId: meeting.id,
        status: submit ? "SUBMITTED" : "PENDING",
        submittedAt: submit ? new Date() : undefined,
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
        status: submit ? "SUBMITTED" : undefined,
        submittedAt: submit ? new Date() : undefined,
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

    if (submit) {
      await prisma.meetingReport.update({
        where: { id: meeting.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          title: vData.churchMinistryName ? `${vData.churchMinistryName} Outreach` : undefined,
        },
      });
    }

    await prisma.reportAuditLog.create({
      data: {
        meetingReportId: meeting.id,
        actorId: user.id,
        action: submit ? "VERIFICATION_SUBMITTED" : "VERIFICATION_SAVED",
        details: submit ? `Verification Form submitted for review by ${user.username}` : `Verification Form draft saved by ${user.username}`,
        formType: "VERIFICATION",
      },
    });

    return NextResponse.json({
      message: submit ? "Verification Form submitted successfully" : "Verification Form saved successfully",
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: updatedSheet.status,
    });
  } catch (err) {
    console.error("POST /api/reports/verification error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
