import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
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

    const { role, id: userId, state: userState, zone: userZone } = session.user as any;

    // Fetch meeting details with assignment history
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, role: true, email: true },
        },
        currentAssignee: {
          select: { id: true, name: true, username: true, role: true, phoneNumber: true, email: true },
        },
        originalLeader: {
          select: { id: true, name: true, username: true, role: true, phoneNumber: true, email: true },
        },
        meetingReport: {
          include: {
            verificationSheet: true,
            attendanceRecord: true,
            afterMeetingReport: true,
            reviewerComments: {
              include: {
                reviewer: { select: { id: true, name: true, username: true, role: true } },
              },
            },
          },
        },
        assignmentHistory: {
          orderBy: { createdAt: "asc" },
          include: {
            previousAssignee: {
              select: { id: true, name: true, username: true, role: true },
            },
            newAssignee: {
              select: { id: true, name: true, username: true, role: true },
            },
            assignedBy: {
              select: { id: true, name: true, username: true, role: true },
            },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // RBAC Authorization check
    let authorized = false;
    if (role === "ADMIN") {
      authorized = true;
    } else if (role === "STATE_LEADER") {
      if (
        meeting.currentAssigneeId === userId ||
        meeting.originalLeaderId === userId ||
        (userState && meeting.state.toLowerCase() === userState.toLowerCase())
      ) {
        authorized = true;
      }
    } else if (role === "ZONE_LEADER") {
      if (meeting.currentAssigneeId === userId || meeting.originalLeaderId === userId) {
        authorized = true;
      }
    } else if (role === "COORDINATOR") {
      if (meeting.currentAssigneeId === userId) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this meeting" },
        { status: 403 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error: any) {
    console.error("GET /api/meetings/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching meeting details" },
      { status: 500 }
    );
  }
}
