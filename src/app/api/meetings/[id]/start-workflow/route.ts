import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId, name: userName } = session.user as any;

    // Retrieve meeting record
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        meetingReport: true,
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Must be the assigned person or Admin
    if (meeting.currentAssigneeId !== userId && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the assigned worker or Administrator can begin this meeting" },
        { status: 403 }
      );
    }

    const year = new Date().getFullYear();

    const result = await prisma.$transaction(async (tx: any) => {
      let linkedReportId = meeting.meetingReportId;
      let linkedReportModel = meeting.meetingReport;

      if (!linkedReportId) {
        const count = await tx.meetingReport.count();
        const candidateReportId = `MR-${year}-${String(count + 1).padStart(5, "0")}`;

        const createdReport = await tx.meetingReport.create({
          data: {
            reportId: candidateReportId,
            title: `Outreach: ${meeting.organizerName} (${meeting.district})`,
            leaderId: userId,
            status: "DRAFT",
            version: 1,
            verificationSheet: {
              create: {
                status: "PENDING",
                convenerName: meeting.organizerName,
                churchMinistryName: "",
                stateDistrictCity: `${meeting.state}, ${meeting.district}`,
                state: meeting.state,
                district: meeting.district,
                contactNumber: "",
                meetingDates: new Date(meeting.meetingDate).toISOString().split("T")[0],
                numberOfDays: 1,
                expectedAttendance: 0,
                yearsOfMinistry: 0,
                churchMembers: 0,
                workersLeaders: 0,
                knowAboutWcm: "Admin Assignment",
                readWcmBooks: false,
                attendedProphetMeeting: false,
                meetingHallStage: "",
                soundSystem: "",
                accommodationTeam: "",
                volunteerSupport: "",
              },
            },
          },
        });

        linkedReportId = createdReport.id;
        linkedReportModel = createdReport as any;
      }

      const updatedMeeting = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          meetingReportId: linkedReportId,
          status: "IN_PROGRESS",
        },
      });

      await tx.meetingAssignmentHistory.create({
        data: {
          meetingId: meeting.id,
          previousAssigneeId: meeting.currentAssigneeId,
          previousRole: meeting.currentAssigneeRole,
          newAssigneeId: userId,
          newRole: role,
          assignedById: userId,
          assignmentAction: "STATUS_CHANGE",
          status: "IN_PROGRESS",
          remarks: `Workflow initiated by ${userName}`,
        },
      });

      return {
        meeting: updatedMeeting,
        meetingReportId: linkedReportId,
        reportId: linkedReportModel?.reportId,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Meeting workflow started",
      ...result,
    });
  } catch (error: any) {
    console.error("POST start-workflow error:", error);
    return NextResponse.json(
      { error: "Internal server error starting meeting workflow" },
      { status: 500 }
    );
  }
}
