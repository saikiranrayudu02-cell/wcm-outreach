import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const forwardSchema = z.object({
  coordinatorId: z.string().uuid("Invalid coordinator ID"),
  remarks: z.string().trim().max(500).optional(),
});

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

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = forwardSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { coordinatorId, remarks } = parsed.data;

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Caller must be current assignee or Admin
    if (meeting.currentAssigneeId !== userId && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the currently assigned leader can forward this meeting" },
        { status: 403 }
      );
    }

    if (
      meeting.status !== "ASSIGNED_TO_LEADER" &&
      meeting.status !== "ACCEPTED_BY_LEADER" &&
      meeting.status !== "PENDING_COORDINATOR_SELECTION" &&
      meeting.status !== "FORWARDED_TO_COORDINATOR"
    ) {
      return NextResponse.json(
        { error: `Cannot forward meeting with status "${meeting.status}"` },
        { status: 400 }
      );
    }

    // Validate selected coordinator
    const coordinator = await prisma.user.findUnique({
      where: { id: coordinatorId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        state: true,
        part: true,
        email: true,
      },
    });

    if (!coordinator) {
      return NextResponse.json({ error: "Coordinator not found" }, { status: 404 });
    }

    if ((coordinator as any).role !== "COORDINATOR") {
      return NextResponse.json(
        { error: "Target assignee must have the role COORDINATOR" },
        { status: 400 }
      );
    }

    // Atomic transaction: Update meeting + Create Assignment History + Send Notification
    const updated = await prisma.$transaction(async (tx: any) => {
      const m = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          currentAssigneeId: coordinator.id,
          currentAssigneeRole: "COORDINATOR",
          status: "FORWARDED_TO_COORDINATOR",
        },
      });

      await tx.meetingAssignmentHistory.create({
        data: {
          meetingId: m.id,
          previousAssigneeId: meeting.currentAssigneeId,
          previousRole: meeting.currentAssigneeRole,
          newAssigneeId: coordinator.id,
          newRole: "COORDINATOR",
          assignedById: userId,
          assignmentAction: "FORWARDED_TO_COORDINATOR",
          status: "FORWARDED_TO_COORDINATOR",
          remarks: remarks || `Forwarded to Coordinator ${coordinator.name} by ${userName}`,
        },
      });

      // Notify the coordinator
      await tx.notification.create({
        data: {
          recipientId: coordinator.id,
          senderId: userId,
          title: `New Meeting Forwarded: ${meeting.referenceId}`,
          message: `${userName} has forwarded an outreach meeting organized by "${meeting.organizerName}" in ${meeting.district}, ${meeting.state} to you for local coordination.`,
        },
      });

      return m;
    });

    return NextResponse.json({
      success: true,
      message: `Meeting successfully forwarded to ${coordinator.name}`,
      meeting: updated,
    });
  } catch (error: any) {
    console.error("POST forward error:", error);
    return NextResponse.json(
      { error: "Internal server error forwarding meeting" },
      { status: 500 }
    );
  }
}
