import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getZoneForState, isValidState, isValidDistrict } from "@/lib/geographic";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Leader discovery requires Admin privileges" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state")?.trim();
    const district = searchParams.get("district")?.trim();

    if (!state || !district) {
      return NextResponse.json(
        { error: "Both state and district query parameters are required" },
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

    const canonicalZone = getZoneForState(state);
    const stateVariations = [
      state,
      state.toLowerCase() === "andhra pradesh" ? "AP" : "Andhra Pradesh",
    ];

    // Fetch users whose geographic assignment matches:
    // 1. State Leaders matching state
    // 2. Zonal Leaders matching state OR matching zone
    // 3. Coordinators matching state and (district OR part)
    const candidates = await prisma.user.findMany({
      where: {
        OR: [
          // State Leader for this state
          {
            role: "STATE_LEADER",
            OR: [
              { state: { in: stateVariations, mode: "insensitive" } },
              { state: "National Headquarters" },
              { state: null },
            ],
          },
          // Zonal Leader for this state or zone
          {
            role: "ZONE_LEADER",
            OR: [
              { state: { in: stateVariations, mode: "insensitive" } },
              { zone: { equals: canonicalZone, mode: "insensitive" } },
              { zone: { equals: "Zone 3", mode: "insensitive" } },
              { part: { equals: district, mode: "insensitive" } },
            ],
          },
          // Coordinator for this state and district/part
          {
            role: "COORDINATOR",
            OR: [
              { state: { in: stateVariations, mode: "insensitive" } },
              { zone: { equals: "Zone 3", mode: "insensitive" } },
              { part: { equals: district, mode: "insensitive" } },
              { part: { contains: district, mode: "insensitive" } },
            ],
          },
        ],
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
    });

    // Compute active workload for each candidate
    const candidateIds = candidates.map((c) => c.id);
    const activeMeetings = await prisma.meeting.findMany({
      where: {
        currentAssigneeId: { in: candidateIds },
        status: {
          in: [
            "ASSIGNED_TO_LEADER",
            "ACCEPTED_BY_LEADER",
            "SELF_HANDLED_BY_LEADER",
            "FORWARDED_TO_COORDINATOR",
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

    // Format and rank candidates
    const rolePriority: Record<string, number> = {
      STATE_LEADER: 1,
      ZONE_LEADER: 2,
      COORDINATOR: 3,
    };

    const results = candidates.map((c: any) => {
      const activeCount = workloadMap.get(c.id) || 0;
      return {
        id: c.id,
        name: c.name,
        username: c.username,
        role: c.role,
        state: c.state || state,
        district: c.part || district,
        zone: c.zone || canonicalZone,
        part: c.part,
        phoneNumber: null,
        email: c.email,
        image: null,
        activeMeetingsCount: activeCount,
        availabilityStatus:
          activeCount === 0
            ? "Available"
            : `${activeCount} Active Assignment${activeCount > 1 ? "s" : ""}`,
        isAvailable: activeCount < 5,
      };
    });

    results.sort((a, b) => {
      const rA = rolePriority[a.role] || 99;
      const rB = rolePriority[b.role] || 99;
      if (rA !== rB) return rA - rB;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      state,
      district,
      zone: canonicalZone,
      totalEligible: results.length,
      leaders: results,
    });
  } catch (error: any) {
    console.error("GET /api/meetings/eligible-leaders error:", error);
    return NextResponse.json(
      { error: "Internal server error discovering eligible leaders" },
      { status: 500 }
    );
  }
}
