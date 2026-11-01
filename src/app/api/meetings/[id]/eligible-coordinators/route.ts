import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Caller must be current assignee or Admin
    if (meeting.currentAssigneeId !== userId && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to forward this meeting" },
        { status: 403 }
      );
    }

    // Find coordinators belonging to the meeting's state/zone or leader's jurisdiction
    const stateVariations = [
      meeting.state,
      meeting.state.toLowerCase() === "andhra pradesh" ? "AP" : "Andhra Pradesh",
    ];

    const conditions: any[] = [
      { state: { in: stateVariations, mode: "insensitive" } },
      { zone: { equals: "Zone 3", mode: "insensitive" } },
    ];

    if (meeting.district) {
      conditions.push({ part: { contains: meeting.district, mode: "insensitive" } });
    }

    if (userState && typeof userState === "string") {
      conditions.push({ state: { equals: userState, mode: "insensitive" } });
    }

    if (userZone && typeof userZone === "string") {
      conditions.push({ zone: { equals: userZone, mode: "insensitive" } });
    }

    const coordinators = await prisma.user.findMany({
      where: {
        role: "COORDINATOR",
        OR: conditions,
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        state: true,
        part: true,
        zone: true,
        email: true,
      },
      orderBy: { name: "asc" },
    });

    // Compute active workload for each coordinator
    const coordinatorIds = coordinators.map((c) => c.id);
    const activeMeetings = await prisma.meeting.findMany({
      where: {
        currentAssigneeId: { in: coordinatorIds },
        status: {
          in: [
            "FORWARDED_TO_COORDINATOR",
            "RECEIVED_BY_COORDINATOR",
            "IN_PROGRESS",
          ],
        },
      },
      select: {
        currentAssigneeId: true,
      },
    });

    const workloadMap = new Map<string, number>();
    activeMeetings.forEach((m: { currentAssigneeId: string | null }) => {
      if (m.currentAssigneeId) {
        workloadMap.set(
          m.currentAssigneeId,
          (workloadMap.get(m.currentAssigneeId) || 0) + 1
        );
      }
    });

    const results = coordinators.map((c: any) => {
      const activeCount = workloadMap.get(c.id) || 0;
      const isDistrictMatch =
        (c.district && c.district.toLowerCase() === meeting.district.toLowerCase()) ||
        (c.part && c.part.toLowerCase().includes(meeting.district.toLowerCase()));

      return {
        ...c,
        activeMeetingsCount: activeCount,
        availabilityStatus: activeCount === 0 ? "Available" : `${activeCount} Active Task${activeCount > 1 ? "s" : ""}`,
        isDistrictMatch: Boolean(isDistrictMatch),
      };
    });

    // Prioritize coordinators matching district
    results.sort((a, b) => {
      if (a.isDistrictMatch && !b.isDistrictMatch) return -1;
      if (!a.isDistrictMatch && b.isDistrictMatch) return 1;
      return a.activeMeetingsCount - b.activeMeetingsCount;
    });

    return NextResponse.json({
      meetingId: meeting.id,
      meetingState: meeting.state,
      meetingDistrict: meeting.district,
      totalEligible: results.length,
      coordinators: results,
    });
  } catch (error: any) {
    console.error("GET eligible-coordinators error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching eligible coordinators" },
      { status: 500 }
    );
  }
}
