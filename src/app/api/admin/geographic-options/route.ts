import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { getAvailableStates, getDistrictsForState } from "@/lib/geographic";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, state: userState, zone: userZone } = session.user as any;

    const { searchParams } = new URL(request.url);
    const selectedState = searchParams.get("state") || undefined;
    const selectedZone = searchParams.get("zone") || undefined;
    const selectedDistrict = searchParams.get("district") || undefined;

    const db = prisma as any;

    // Enforce role-based geographic access restrictions
    const effectiveState = role === "STATE_LEADER" ? userState : selectedState;
    const effectiveZone = role === "ZONE_LEADER" ? userZone : selectedZone;

    // Fetch distinct geographic values from verification sheets
    const sheets = await db.verificationSheet.findMany({
      where: {
        ...(effectiveState ? { state: effectiveState } : {}),
        ...(effectiveZone ? { zone: effectiveZone } : {}),
        ...(selectedDistrict ? { district: selectedDistrict } : {}),
      },
      select: {
        state: true,
        zone: true,
        district: true,
        part: true,
      },
    });

    // Also get all distinct states available across the system
    const allSheets = await db.verificationSheet.findMany({
      select: {
        state: true,
        zone: true,
        district: true,
        part: true,
      },
    });

    const statesSet = new Set<string>(getAvailableStates());
    const zonesSet = new Set<string>(["South", "North", "East", "West", "Central"]);
    const districtsSet = new Set<string>();
    const partsSet = new Set<string>();

    allSheets.forEach((s: any) => {
      if (s.state) statesSet.add(s.state);
    });

    if (effectiveState) {
      const canonicalDistricts = getDistrictsForState(effectiveState);
      canonicalDistricts.forEach((d) => districtsSet.add(d));
    }

    sheets.forEach((s: any) => {
      if (s.zone) zonesSet.add(s.zone);
      if (s.district) districtsSet.add(s.district);
      if (s.part) partsSet.add(s.part);
    });

    // If role is state leader, they only see their own state
    const states = role === "STATE_LEADER" && userState
      ? [userState]
      : Array.from(statesSet).sort();

    const zones = Array.from(zonesSet).sort();
    const districts = Array.from(districtsSet).sort();
    const parts = Array.from(partsSet).sort();

    return NextResponse.json({
      states,
      zones,
      districts,
      parts,
      scopedRole: role,
      lockedState: role === "STATE_LEADER" ? userState : null,
      lockedZone: role === "ZONE_LEADER" ? userZone : null,
    });
  } catch (error: any) {
    console.error("Error in /api/admin/geographic-options:", error);
    return NextResponse.json(
      { error: "Internal server error fetching geographic options." },
      { status: 500 }
    );
  }
}
