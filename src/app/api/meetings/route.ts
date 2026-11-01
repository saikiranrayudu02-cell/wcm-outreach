import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { isValidState, isValidDistrict } from "@/lib/geographic";

export const dynamic = "force-dynamic";

const createMeetingSchema = z.object({
  meetingDate: z.string().min(1, "Meeting date is required"),
  organizerName: z.string().trim().min(2, "Organizer name must be at least 2 characters"),
  state: z.string().trim().min(1, "State is required"),
  district: z.string().trim().min(1, "District is required"),
  leaderId: z.string().uuid("Invalid leader ID format"),
  remarks: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: userId, state: userState, zone: userZone } = session.user as any;
    const { searchParams } = new URL(request.url);

    const filterState = searchParams.get("state")?.trim() || undefined;
    const filterDistrict = searchParams.get("district")?.trim() || undefined;
    const filterStatus = searchParams.get("status")?.trim() || undefined;
    const filterLeaderId = searchParams.get("leaderId")?.trim() || undefined;
    const filterCoordinatorId = searchParams.get("coordinatorId")?.trim() || undefined;
    const searchQuery = searchParams.get("search")?.trim() || undefined;
    const filterTab = searchParams.get("tab")?.trim() || undefined; // "assigned", "received", "self-handled", "forwarded"

    // Construct RBAC where clause
    let whereClause: any = {};

    if (role === "ADMIN") {
      whereClause = {};
    } else if (role === "STATE_LEADER") {
      whereClause = {
        OR: [
          { currentAssigneeId: userId },
          { originalLeaderId: userId },
          ...(userState ? [{ state: { equals: userState, mode: "insensitive" } }] : []),
        ],
      };
    } else if (role === "ZONE_LEADER") {
      whereClause = {
        OR: [
          { currentAssigneeId: userId },
          { originalLeaderId: userId },
        ],
      };
    } else if (role === "COORDINATOR") {
      whereClause = {
        currentAssigneeId: userId,
      };
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Apply query filters
    if (filterState) {
      whereClause.state = { equals: filterState, mode: "insensitive" };
    }
    if (filterDistrict) {
      whereClause.district = { equals: filterDistrict, mode: "insensitive" };
    }
    if (filterStatus) {
      whereClause.status = filterStatus;
    }
    if (filterLeaderId) {
      whereClause.originalLeaderId = filterLeaderId;
    }
    if (filterCoordinatorId) {
      whereClause.currentAssigneeId = filterCoordinatorId;
    }

    if (filterTab === "assigned") {
      whereClause.currentAssigneeId = userId;
    } else if (filterTab === "received") {
      whereClause.currentAssigneeId = userId;
      whereClause.status = { in: ["FORWARDED_TO_COORDINATOR", "RECEIVED_BY_COORDINATOR", "IN_PROGRESS"] };
    } else if (filterTab === "self-handled") {
      whereClause.status = "SELF_HANDLED_BY_LEADER";
    } else if (filterTab === "forwarded") {
      whereClause.status = "FORWARDED_TO_COORDINATOR";
    }

    if (searchQuery) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { referenceId: { contains: searchQuery, mode: "insensitive" } },
            { organizerName: { contains: searchQuery, mode: "insensitive" } },
            { state: { contains: searchQuery, mode: "insensitive" } },
            { district: { contains: searchQuery, mode: "insensitive" } },
          ],
        },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true, role: true },
        },
        currentAssignee: {
          select: { id: true, name: true, username: true, role: true, phoneNumber: true, email: true },
        },
        originalLeader: {
          select: { id: true, name: true, username: true, role: true, phoneNumber: true, email: true },
        },
        meetingReport: {
          select: {
            id: true,
            reportId: true,
            status: true,
            verificationSheet: {
              select: { id: true, status: true, isCallLocked: true },
            },
          },
        },
        assignmentHistory: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            previousAssignee: { select: { id: true, name: true, username: true, role: true } },
            newAssignee: { select: { id: true, name: true, username: true, role: true } },
            assignedBy: { select: { id: true, name: true, username: true, role: true } },
          },
        },
      },
    });

    // If Admin, compute summary counts
    let stats = null;
    if (role === "ADMIN") {
      const allMeetings = await prisma.meeting.findMany({
        select: { status: true },
      });

      stats = {
        total: allMeetings.length,
        assignedToLeaders: allMeetings.filter((m: { status: string }) =>
          ["ASSIGNED_TO_LEADER", "ACCEPTED_BY_LEADER"].includes(m.status)
        ).length,
        selfHandled: allMeetings.filter((m: { status: string }) => m.status === "SELF_HANDLED_BY_LEADER").length,
        forwardedToCoordinators: allMeetings.filter((m: { status: string }) =>
          ["FORWARDED_TO_COORDINATOR", "RECEIVED_BY_COORDINATOR"].includes(m.status)
        ).length,
        inProgress: allMeetings.filter((m: { status: string }) => m.status === "IN_PROGRESS").length,
        completed: allMeetings.filter((m: { status: string }) => m.status === "COMPLETED").length,
        cancelled: allMeetings.filter((m: { status: string }) => m.status === "CANCELLED").length,
      };
    }

    return NextResponse.json({
      meetings,
      stats,
      scopedRole: role,
    });
  } catch (error: any) {
    console.error("GET /api/meetings error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching meetings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, id: adminId } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Administrators can create and assign meetings" },
        { status: 403 }
      );
    }

    let rawBody: any = {};
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createMeetingSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid input data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { meetingDate, organizerName, state, district, leaderId, remarks } = parsed.data;

    // Validate meetingDate
    const parsedDate = new Date(meetingDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid meeting date format" },
        { status: 400 }
      );
    }

    // Validate state and district
    if (!isValidState(state)) {
      return NextResponse.json(
        { error: `Invalid state: "${state}"` },
        { status: 400 }
      );
    }

    if (!isValidDistrict(state, district)) {
      return NextResponse.json(
        { error: `Invalid district "${district}" for state "${state}"` },
        { status: 400 }
      );
    }

    // Verify leader exists and is eligible
    const selectedLeader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        state: true,
        district: true,
        part: true,
        zone: true,
      } as any,
    });

    if (!selectedLeader) {
      return NextResponse.json(
        { error: "Selected assignee was not found" },
        { status: 404 }
      );
    }

    const leaderObj = selectedLeader as any;
    if (
      leaderObj.role !== "STATE_LEADER" &&
      leaderObj.role !== "ZONE_LEADER" &&
      leaderObj.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        { error: "Selected assignee must be a State Leader, Zonal Leader, or Coordinator" },
        { status: 400 }
      );
    }

    // Generate unique reference ID (e.g. MTG-YYYY-XXXXX)
    const year = new Date().getFullYear();
    let referenceId = "";
    let attempts = 0;

    while (attempts < 5) {
      const count = await prisma.meeting.count();
      const candidateRef = attempts === 0
        ? `MTG-${year}-${String(count + 1).padStart(5, "0")}`
        : `MTG-${year}-${String(count + 1).padStart(5, "0")}-${Math.floor(100 + Math.random() * 900)}`;

      const exists = await prisma.meeting.findUnique({ where: { referenceId: candidateRef } });
      if (!exists) {
        referenceId = candidateRef;
        break;
      }
      attempts++;
    }

    if (!referenceId) {
      referenceId = `MTG-${year}-${Date.now().toString().slice(-6)}`;
    }

    // Execute atomic transaction: Create Meeting + Initial Assignment History + Notification
    const result = await prisma.$transaction(async (tx: any) => {
      const createdMeeting = await tx.meeting.create({
        data: {
          referenceId,
          meetingDate: parsedDate,
          organizerName,
          state,
          district,
          createdById: adminId,
          currentAssigneeId: leaderObj.id,
          currentAssigneeRole: leaderObj.role,
          originalLeaderId: leaderObj.id,
          status: "ASSIGNED_TO_LEADER",
          remarks: remarks || null,
        },
      });

      await tx.meetingAssignmentHistory.create({
        data: {
          meetingId: createdMeeting.id,
          newAssigneeId: leaderObj.id,
          newRole: leaderObj.role,
          assignedById: adminId,
          assignmentAction: "INITIAL_ADMIN_ASSIGNMENT",
          status: "ASSIGNED_TO_LEADER",
          remarks: remarks || `Assigned to ${String(leaderObj.role).replace(/_/g, " ")} by Admin`,
        },
      });

      // Dispatch Notification to the assigned leader
      await tx.notification.create({
        data: {
          recipientId: selectedLeader.id,
          senderId: adminId,
          title: `New Meeting Assigned: ${referenceId}`,
          message: `Admin assigned you a new outreach meeting organized by "${organizerName}" in ${district}, ${state} scheduled for ${parsedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.`,
        },
      });

      return createdMeeting;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Meeting ${referenceId} created and assigned to ${selectedLeader.name}`,
        meeting: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/meetings error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error creating meeting" },
      { status: 500 }
    );
  }
}
