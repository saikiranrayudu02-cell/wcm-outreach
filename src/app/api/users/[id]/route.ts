import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  name: z.string().optional(),
  phoneNumber: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "COORDINATOR", "STATE_LEADER", "ZONE_LEADER"]),
  state: z.string().nullable().optional(),
  part: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  password: z.string().min(6).optional().nullable(),
});

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await props.params;
    const sessionUser = session.user as any;
    const sessionRole = sessionUser.role;

    const user: any = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        state: true,
        zone: true,
        part: true,
        image: true,
        createdAt: true,
        meetingReports: {
          select: {
            id: true,
            reportId: true,
            status: true,
            submittedAt: true,
            attendanceRecord: {
              select: {
                membersAttended: true,
                pastorsAttended: true,
                date: true,
                location: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            meetingReports: true,
          },
        },
      } as any,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role-based scoping
    if (sessionRole === "STATE_LEADER") {
      if (user.state !== sessionUser.state || (user.role !== "ZONE_LEADER" && user.role !== "COORDINATOR")) {
        return NextResponse.json({ error: "Forbidden: Candidate is outside your state scope" }, { status: 403 });
      }
    } else if (sessionRole === "ZONE_LEADER") {
      if (user.zone !== sessionUser.zone || user.role !== "COORDINATOR") {
        return NextResponse.json({ error: "Forbidden: Candidate is outside your zone scope" }, { status: 403 });
      }
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/users/[id] error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("PUT /api/users/[id] - Session User:", session?.user);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const sessionRole = sessionUser.role;
    if (sessionRole !== "ADMIN" && sessionRole !== "STATE_LEADER" && sessionRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await props.params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role boundaries checks
    if (sessionRole === "STATE_LEADER") {
      if (existingUser.role !== "COORDINATOR") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (existingUser.state !== sessionUser.state) {
        return NextResponse.json({ error: "Forbidden: Coordinator belongs to another state" }, { status: 403 });
      }
      if (validatedData.role !== "COORDINATOR" || validatedData.state !== sessionUser.state) {
        return NextResponse.json({ error: "Forbidden: Cannot change coordinator state or assign invalid role" }, { status: 403 });
      }
    } else if (sessionRole === "ZONE_LEADER") {
      if (existingUser.role !== "COORDINATOR") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (existingUser.zone !== sessionUser.zone) {
        return NextResponse.json({ error: "Forbidden: Coordinator belongs to another zone" }, { status: 403 });
      }
      if (validatedData.role !== "COORDINATOR" || validatedData.zone !== sessionUser.zone) {
        return NextResponse.json({ error: "Forbidden: Cannot change coordinator zone or assign invalid role" }, { status: 403 });
      }
    }

    const updateData: any = {
      role: validatedData.role,
      state: validatedData.state || null,
      part: validatedData.part || null,
      zone: validatedData.zone || null,
    };
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.phoneNumber !== undefined) updateData.phoneNumber = validatedData.phoneNumber;


    let newPasswordHash: string | null = null;
    if (validatedData.password) {
      newPasswordHash = await bcrypt.hash(validatedData.password, 10);
      updateData.passwordHash = newPasswordHash;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update user profile
      await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // 2. If password changed, update Better Auth credentials
      if (newPasswordHash) {
        await tx.account.updateMany({
          where: { userId: userId, providerId: "credential" },
          data: { password: newPasswordHash },
        });
      }
    });

    return NextResponse.json({ message: "User Updated Successfully" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const sessionRole = sessionUser.role;
    if (sessionRole !== "ADMIN" && sessionRole !== "STATE_LEADER" && sessionRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId } = await props.params;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting oneself
    if (existingUser.id === sessionUser.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Role boundaries checks
    if (sessionRole === "STATE_LEADER") {
      if (existingUser.role !== "COORDINATOR" || existingUser.state !== sessionUser.state) {
        return NextResponse.json({ error: "Forbidden: Cannot delete this user" }, { status: 403 });
      }
    } else if (sessionRole === "ZONE_LEADER") {
      if (existingUser.role !== "COORDINATOR" || existingUser.zone !== sessionUser.zone) {
        return NextResponse.json({ error: "Forbidden: Cannot delete this user" }, { status: 403 });
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "User Deleted Successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
