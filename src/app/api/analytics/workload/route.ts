import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const filterState = searchParams.get("state") || undefined;
    const filterZone = searchParams.get("zone") || undefined;
    const filterDistrict = searchParams.get("district") || undefined;
    const filterPart = searchParams.get("part") || undefined;

    // Enforce role-based access
    const effectiveState = role === "STATE_LEADER" ? userState : filterState;
    const effectiveZone = role === "ZONE_LEADER" ? userZone : filterZone;

    const db = prisma as any;

    // Query all relevant verification sheets and meeting reports
    const sheets = await db.verificationSheet.findMany({
      where: {
        ...(effectiveState ? { state: effectiveState } : {}),
        ...(effectiveZone ? { zone: effectiveZone } : {}),
        ...(filterDistrict ? { district: filterDistrict } : {}),
        ...(filterPart ? { part: filterPart } : {}),
      },
      include: {
        meetingReport: {
          include: {
            leader: {
              select: { name: true, username: true, state: true, zone: true, part: true },
            },
            attendanceRecord: { select: { status: true } },
            afterMeetingReport: { select: { status: true } },
          },
        },
        callAttempts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // Helper to calculate metrics for a collection of sheets
    function computeMetrics(items: any[]) {
      const totalForms = items.length;
      let pendingForms = 0;
      let completedForms = 0;
      let pendingCalls = 0;
      let callsInProgress = 0;
      let completedCalls = 0;
      let noAnswerCalls = 0;
      let failedCalls = 0;
      let retryEligible = 0;
      let answeredLocked = 0;

      const now = Date.now();

      for (const s of items) {
        const isVerified = s.status === "COMPLETED";
        const hasAttendance = s.meetingReport?.attendanceRecord?.status === "COMPLETED";
        const hasEval = s.meetingReport?.afterMeetingReport?.status === "COMPLETED";

        if (isVerified && hasAttendance && hasEval) {
          completedForms++;
        } else {
          pendingForms++;
        }

        const isLocked = Boolean(s.isCallLocked);
        if (isLocked) {
          answeredLocked++;
        }

        const attempts = s.callAttempts || [];
        const latestAttempt = attempts[0];

        // Call attempts metrics
        for (const a of attempts) {
          if (a.status === "COMPLETED") completedCalls++;
          else if (a.status === "NO_ANSWER") noAnswerCalls++;
          else if (a.status === "FAILED") failedCalls++;
        }

        const activeAttempt = attempts.find(
          (a: any) =>
            (a.status === "DISPATCHED" || a.status === "IN_PROGRESS") &&
            (now - new Date(a.initiatedAt).getTime()) / (1000 * 60) < 15
        );

        if (activeAttempt) {
          callsInProgress++;
        }

        // Calling eligibility
        if (isVerified && !isLocked) {
          if (!latestAttempt) {
            pendingCalls++;
          } else if (
            (latestAttempt.status === "NO_ANSWER" || latestAttempt.status === "BUSY" || latestAttempt.status === "FAILED") &&
            !activeAttempt &&
            attempts.length < 5
          ) {
            retryEligible++;
          }
        }
      }

      return {
        totalForms,
        pendingForms,
        completedForms,
        pendingCalls,
        callsInProgress,
        completedCalls,
        noAnswerCalls,
        failedCalls,
        retryEligible,
        answeredLocked,
      };
    }

    // Overall summary
    const nationalSummary = computeMetrics(sheets);

    // Group by State
    const stateMap = new Map<string, any[]>();
    for (const s of sheets) {
      const st = s.state || "Location Not Assigned";
      if (!stateMap.has(st)) stateMap.set(st, []);
      stateMap.get(st)!.push(s);
    }

    const stateBreakdown: any[] = [];
    for (const [stateName, stateSheets] of stateMap.entries()) {
      const metrics = computeMetrics(stateSheets);

      // Group by Zone within this state
      const zoneMap = new Map<string, any[]>();
      for (const s of stateSheets) {
        const zn = s.zone || "General Zone";
        if (!zoneMap.has(zn)) zoneMap.set(zn, []);
        zoneMap.get(zn)!.push(s);
      }

      const zoneBreakdown: any[] = [];
      for (const [zoneName, zoneSheets] of zoneMap.entries()) {
        const zMetrics = computeMetrics(zoneSheets);

        // Group by District within this zone
        const distMap = new Map<string, any[]>();
        for (const s of zoneSheets) {
          const dt = s.district || "General District";
          if (!distMap.has(dt)) distMap.set(dt, []);
          distMap.get(dt)!.push(s);
        }

        const districtBreakdown = Array.from(distMap.entries()).map(([districtName, distSheets]) => ({
          district: districtName,
          ...computeMetrics(distSheets),
          formsCount: distSheets.length,
        }));

        zoneBreakdown.push({
          zone: zoneName,
          ...zMetrics,
          districts: districtBreakdown,
        });
      }

      stateBreakdown.push({
        state: stateName,
        ...metrics,
        zones: zoneBreakdown,
      });
    }

    // Sort states with highest workload (pending forms + pending calls) first
    stateBreakdown.sort((a, b) => (b.pendingForms + b.pendingCalls) - (a.pendingForms + a.pendingCalls));

    return NextResponse.json({
      summary: nationalSummary,
      stateBreakdown,
      scopedRole: role,
      appliedFilters: {
        state: effectiveState || null,
        zone: effectiveZone || null,
        district: filterDistrict || null,
        part: filterPart || null,
      },
    });
  } catch (error: any) {
    console.error("Error in /api/analytics/workload:", error);
    return NextResponse.json(
      { error: "Internal server error fetching workload analytics." },
      { status: 500 }
    );
  }
}
