import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logOrganizationAction } from "@/lib/hierarchy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createZoneSchema = z.object({
  stateId: z.string().uuid("Valid State ID is required"),
  name: z.string().trim().min(2, "Zone name must be at least 2 characters").max(100),
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
    const stateId = searchParams.get("stateId");
    const stateName = searchParams.get("stateName");

    // Build filter
    const whereClause: any = { isActive: true };

    if (stateId) {
      whereClause.stateId = stateId;
    } else if (stateName) {
      whereClause.state = { name: { equals: stateName, mode: "insensitive" } };
    }

    // Role-based scoping
    if (role === "STATE_LEADER") {
      whereClause.state = { name: { equals: userState || "", mode: "insensitive" } };
    } else if (role === "ZONE_LEADER") {
      whereClause.name = { equals: userZone || "", mode: "insensitive" };
      whereClause.state = { name: { equals: userState || "", mode: "insensitive" } };
    }

    const zones = await prisma.zone.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        stateId: true,
        isActive: true,
        state: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            districts: true,
            users: true,
          },
        },
        users: {
          where: { role: "ZONE_LEADER", isActive: true },
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

    const results = zones.map((z) => ({
      id: z.id,
      name: z.name,
      stateId: z.stateId,
      stateName: z.state.name,
      isActive: z.isActive,
      districtsCount: z._count.districts,
      usersCount: z._count.users,
      zonalLeader: z.users[0] || null,
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET /api/admin/hierarchy/zones error:", error);
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
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
    const validated = createZoneSchema.parse(body);

    const state = await prisma.state.findUnique({
      where: { id: validated.stateId },
    });

    if (!state) {
      return NextResponse.json({ error: "Target state not found" }, { status: 404 });
    }

    const existing = await prisma.zone.findFirst({
      where: {
        stateId: validated.stateId,
        name: { equals: validated.name, mode: "insensitive" },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Zone '${validated.name}' already exists in state '${state.name}'.` },
        { status: 409 }
      );
    }

    const newZone = await prisma.zone.create({
      data: {
        name: validated.name,
        stateId: validated.stateId,
        isActive: true,
      },
      include: {
        state: true,
      },
    });

    await logOrganizationAction({
      action: "ZONE_CREATED",
      actorId: sessionUser.id,
      entityType: "ZONE",
      entityId: newZone.id,
      newState: { id: newZone.id, name: newZone.name, stateId: newZone.stateId, stateName: state.name },
      remarks: `Admin ${sessionUser.name || sessionUser.username} created Zone '${newZone.name}' under State '${state.name}'`,
    });

    return NextResponse.json(newZone, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/admin/hierarchy/zones error:", error);
    return NextResponse.json({ error: "Failed to create zone" }, { status: 500 });
  }
}
