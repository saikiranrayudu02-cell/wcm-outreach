import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { logOrganizationAction } from "@/lib/hierarchy";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createStateSchema = z.object({
  name: z.string().trim().min(2, "State name must be at least 2 characters").max(100),
  code: z.string().trim().max(10).optional().nullable(),
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
    const { role, state: userState } = sessionUser;

    // Build query based on role
    let whereCondition: any = { isActive: true };
    if (role === "STATE_LEADER") {
      whereCondition = {
        isActive: true,
        name: { equals: userState || "", mode: "insensitive" },
      };
    } else if (role === "ZONE_LEADER") {
      whereCondition = {
        isActive: true,
        name: { equals: userState || "", mode: "insensitive" },
      };
    }

    const states = await prisma.state.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        _count: {
          select: {
            zones: true,
            users: true,
          },
        },
        users: {
          where: { role: "STATE_LEADER", isActive: true },
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

    const results = states.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      isActive: s.isActive,
      zonesCount: s._count.zones,
      usersCount: s._count.users,
      stateLeader: s.users[0] || null,
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("GET /api/admin/hierarchy/states error:", error);
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
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
    const validated = createStateSchema.parse(body);

    const existing = await prisma.state.findFirst({
      where: { name: { equals: validated.name, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `State '${validated.name}' already exists in the system.` },
        { status: 409 }
      );
    }

    const newState = await prisma.state.create({
      data: {
        name: validated.name,
        code: validated.code || validated.name.substring(0, 3).toUpperCase(),
        isActive: true,
      },
    });

    await logOrganizationAction({
      action: "STATE_CREATED",
      actorId: sessionUser.id,
      entityType: "STATE",
      entityId: newState.id,
      newState: { id: newState.id, name: newState.name, code: newState.code },
      remarks: `Admin ${sessionUser.name || sessionUser.username} created State '${newState.name}'`,
    });

    return NextResponse.json(newState, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/admin/hierarchy/states error:", error);
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
  }
}
