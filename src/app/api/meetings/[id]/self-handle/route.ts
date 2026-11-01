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

    // Must be the assigned user or Admin
    if (meeting.currentAssigneeId !== userId && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the assigned leader can choose to self-handle this meeting" },
        { status: 403 }
      );
    }

    if (
      meeting.status !== "ASSIGNED_TO_LEADER" &&
      meeting.status !== "ACCEPTED_BY_LEADER" &&
      meeting.status !== "SELF_HANDLED_BY_LEADER"
    ) {
      return NextResponse.json(
        { error: `Cannot self-handle meeting with status ${meeting.status}` },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();

    // Atomic update
    const updated = await prisma.$transaction(async (tx: any) => {
      let reportIdToLink = meeting.meetingReportId;

      // If no meetingReport exists, create one with prefilled verification sheet
      if (!reportIdToLink) {
        const count = await tx.meetingReport.count();
        const candidateReportId = `MR-${year}-${String(count + 1).padStart(5, "0")}`;

        const newReport = await tx.meetingReport.create({
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

        reportIdToLink = newReport.id;
      }

      const m = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          status: "SELF_HANDLED_BY_LEADER",
          meetingReportId: reportIdToLink,
        },
      });

      await tx.meetingAssignmentHistory.create({
        data: {
          meetingId: m.id,
          previousAssigneeId: meeting.currentAssigneeId,
          previousRole: meeting.currentAssigneeRole,
          newAssigneeId: userId,
          newRole: role,
          assignedById: userId,
          assignmentAction: "SELF_HANDLED",
          status: "SELF_HANDLED_BY_LEADER",
          remarks: `Leader ${userName} chose to handle the meeting personally`,
        },
      });

      return m;
    });

    return NextResponse.json({
      success: true,
      message: "Meeting marked for self-handling",
      meeting: updated,
    });
  } catch (error: any) {
    console.error("POST /api/meetings/[id]/self-handle error:", error);
    return NextResponse.json(
      { error: "Internal server error updating meeting to self-handle" },
      { status: 500 }
    );
  }
}
