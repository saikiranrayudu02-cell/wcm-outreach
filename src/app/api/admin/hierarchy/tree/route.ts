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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const { role, state: userState, zone: userZone } = sessionUser;

    let stateFilter: any = { isActive: true };
    if (role === "STATE_LEADER") {
      stateFilter = {
        isActive: true,
        name: { equals: userState || "", mode: "insensitive" },
      };
    } else if (role === "ZONE_LEADER") {
      stateFilter = {
        isActive: true,
        name: { equals: userState || "", mode: "insensitive" },
      };
    } else if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Leader or Admin access required" }, { status: 403 });
    }

    const states = await prisma.state.findMany({
      where: stateFilter,
      include: {
        users: {
          where: { role: "STATE_LEADER" },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        zones: {
          where: {
            isActive: true,
            ...(role === "ZONE_LEADER" ? { name: { equals: userZone || "", mode: "insensitive" } } : {}),
          },
          include: {
            users: {
              where: { role: "ZONE_LEADER" },
              select: {
                id: true,
                name: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                createdAt: true,
              },
            },
            districts: {
              where: { isActive: true },
              include: {
                users: {
                  where: {
                    role: "COORDINATOR",
                    ...(role === "ZONE_LEADER" ? { parentZonalLeaderId: sessionUser.id } : {}),
                  },
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    email: true,
                    phoneNumber: true,
                    role: true,
                    isActive: true,
                    parentZonalLeaderId: true,
                    parentZonalLeader: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                      },
                    },
                    createdAt: true,
                  },
                },
              },
              orderBy: { name: "asc" },
            },
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Compute summary metrics
    let totalZones = 0;
    let totalDistricts = 0;
    let totalCoordinators = 0;
    let totalZonalLeaders = 0;
    let totalStateLeaders = 0;

    const formattedTree = states.map((s) => {
      const stateLeader = s.users.find((u) => u.isActive) || s.users[0] || null;
      if (stateLeader) totalStateLeaders++;

      const zones = s.zones.map((z) => {
        totalZones++;
        const zonalLeader = z.users.find((u) => u.isActive) || z.users[0] || null;
        if (zonalLeader) totalZonalLeaders++;

        const districts = z.districts.map((d) => {
          totalDistricts++;
          totalCoordinators += d.users.length;

          return {
            id: d.id,
            name: d.name,
            isActive: d.isActive,
            coordinators: d.users,
            coordinatorsCount: d.users.length,
          };
        });

        const zoneCoordinatorCount = districts.reduce((acc, curr) => acc + curr.coordinatorsCount, 0);

        return {
          id: z.id,
          name: z.name,
          isActive: z.isActive,
          zonalLeader,
          districts,
          districtsCount: districts.length,
          coordinatorsCount: zoneCoordinatorCount,
        };
      });

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        isActive: s.isActive,
        stateLeader,
        zones,
        zonesCount: zones.length,
      };
    });

    return NextResponse.json({
      summary: {
        totalStates: states.length,
        totalZones,
        totalDistricts,
        totalStateLeaders,
        totalZonalLeaders,
        totalCoordinators,
      },
      tree: formattedTree,
    });
  } catch (error: any) {
    console.error("GET /api/admin/hierarchy/tree error:", error);
    return NextResponse.json({ error: "Failed to generate hierarchy tree" }, { status: 500 });
  }
}
