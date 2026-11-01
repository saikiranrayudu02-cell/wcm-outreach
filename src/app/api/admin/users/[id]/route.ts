import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { validateHierarchyScope, getActiveZonalLeader, logOrganizationAction } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Full Name must be at least 2 characters").max(100).optional(),
  phoneNumber: z.string().trim().optional().nullable(),
  email: z.string().email().optional().nullable(),
  stateId: z.string().uuid().optional().nullable(),
  zoneId: z.string().uuid().optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
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

    const sessionUser = session.user as any;
    const { role: sessionRole, id: sessionUserId, state: userState, zone: userZone } = sessionUser;

    const { id: targetUserId } = await props.params;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        state: true,
        zone: true,
        district: true,
        part: true,
        stateId: true,
        zoneId: true,
        districtId: true,
        parentZonalLeaderId: true,
        stateRef: { select: { id: true, name: true, code: true } },
        zoneRef: { select: { id: true, name: true } },
        districtRef: { select: { id: true, name: true } },
        parentZonalLeader: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
        subordinateCoordinators: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            district: true,
            districtRef: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            assignedMeetings: true,
            meetingReports: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Server-side Access Control enforcement
    if (sessionRole === "STATE_LEADER") {
      if (user.state !== userState && user.stateRef?.name !== userState) {
        return NextResponse.json({ error: "Forbidden: User belongs to another state" }, { status: 403 });
      }
    } else if (sessionRole === "ZONE_LEADER") {
      if (user.role !== "COORDINATOR" || user.parentZonalLeaderId !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden: You may only view coordinators in your assigned team" }, { status: 403 });
      }
    } else if (sessionRole === "COORDINATOR") {
      if (user.id !== sessionUserId) {
        return NextResponse.json({ error: "Forbidden: You may only view your own profile" }, { status: 403 });
      }
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
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

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id: targetUserId } = await props.params;
    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { stateRef: true, zoneRef: true, districtRef: true },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.phoneNumber !== undefined) updateData.phoneNumber = validated.phoneNumber;
    if (validated.email !== undefined && validated.email) updateData.email = validated.email;

    // Geographic update validation
    if (validated.stateId || validated.zoneId || validated.districtId) {
      const stateId = validated.stateId || existingUser.stateId;
      const zoneId = validated.zoneId || existingUser.zoneId;
      const districtId = validated.districtId || existingUser.districtId;

      if (stateId) {
        const validation = await validateHierarchyScope(stateId, zoneId, districtId);
        if (!validation.valid) {
          return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        updateData.stateId = stateId;
        updateData.state = validation.state?.name || existingUser.state;

        if (zoneId) {
          updateData.zoneId = zoneId;
          updateData.zone = validation.zone?.name || existingUser.zone;
        }

        if (districtId) {
          updateData.districtId = districtId;
          updateData.district = validation.district?.name || existingUser.district;
          updateData.part = validation.district?.name || existingUser.part;
        }

        // If coordinator's zone changed, re-evaluate parent Zonal Leader
        if (existingUser.role === "COORDINATOR" && zoneId && zoneId !== existingUser.zoneId) {
          const activeZonalLeader = await getActiveZonalLeader(zoneId);
          if (!activeZonalLeader) {
            return NextResponse.json(
              { error: `Cannot move Coordinator: No active Zonal Leader exists in the target Zone.` },
              { status: 422 }
            );
          }
          updateData.parentZonalLeaderId = activeZonalLeader.id;
        }
      }
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: targetUserId },
        data: updateData,
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          isActive: true,
          state: true,
          zone: true,
          district: true,
        },
      });

      await tx.organizationAuditLog.create({
        data: {
          action: "USER_UPDATED",
          actorId: sessionUser.id,
          targetUserId: targetUserId,
          entityType: "USER",
          entityId: targetUserId,
          previousState: {
            name: existingUser.name,
            phoneNumber: existingUser.phoneNumber,
            state: existingUser.state,
            zone: existingUser.zone,
            district: existingUser.district,
          },
          newState: user,
          remarks: `Admin ${sessionUser.name || sessionUser.username} updated profile for ${user.username}`,
        },
      });

      return user;
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("PUT /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
