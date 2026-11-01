import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logOrganizationAction } from "@/lib/hierarchy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createDistrictSchema = z.object({
  zoneId: z.string().uuid("Valid Zone ID is required"),
  name: z.string().trim().min(2, "District name must be at least 2 characters").max(100),
});

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

    const { searchParams } = new URL(request.url);
    const zoneId = searchParams.get("zoneId");

    const whereClause: any = { isActive: true };

    if (zoneId) {
      whereClause.zoneId = zoneId;
    }

    // Role-based scoping
    if (role === "ZONE_LEADER") {
      whereClause.zone = {
        name: { equals: userZone || "", mode: "insensitive" },
        state: { name: { equals: userState || "", mode: "insensitive" } },
      };
    } else if (role === "STATE_LEADER") {
      whereClause.zone = {
        state: { name: { equals: userState || "", mode: "insensitive" } },
      };
    }

    const districts = await prisma.district.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        zoneId: true,
        isActive: true,
        zone: {
          select: {
            id: true,
            name: true,
            state: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
        users: {
          where: { role: "COORDINATOR", isActive: true },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const results = districts.map((d) => ({
      id: d.id,
      name: d.name,
      zoneId: d.zoneId,
      zoneName: d.zone.name,
      stateName: d.zone.state.name,
      isActive: d.isActive,
      coordinatorsCount: d._count.users,
      coordinators: d.users,
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET /api/admin/hierarchy/districts error:", error);
    return NextResponse.json({ error: "Failed to fetch districts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createDistrictSchema.parse(body);

    const zone = await prisma.zone.findUnique({
      where: { id: validated.zoneId },
      include: { state: true },
    });

    if (!zone) {
      return NextResponse.json({ error: "Target zone not found" }, { status: 404 });
    }

    const existing = await prisma.district.findFirst({
      where: {
        zoneId: validated.zoneId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `District '${validated.name}' already exists in zone '${zone.name}'.` },
        { status: 409 }
      );
    }

    const newDistrict = await prisma.district.create({
      data: {
        name: validated.name,
        zoneId: validated.zoneId,
        isActive: true,
      },
      include: {
        zone: {
          include: { state: true },
        },
      },
    });

    await logOrganizationAction({
      action: "DISTRICT_CREATED",
      actorId: sessionUser.id,
      entityType: "DISTRICT",
      entityId: newDistrict.id,
      newState: {
        id: newDistrict.id,
        name: newDistrict.name,
        zoneId: newDistrict.zoneId,
        zoneName: zone.name,
        stateName: zone.state.name,
      },
      remarks: `Admin ${sessionUser.name || sessionUser.username} created District '${newDistrict.name}' under Zone '${zone.name}' (${zone.state.name})`,
    });

    return NextResponse.json(newDistrict, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/admin/hierarchy/districts error:", error);
    return NextResponse.json({ error: "Failed to create district" }, { status: 500 });
  }
}
