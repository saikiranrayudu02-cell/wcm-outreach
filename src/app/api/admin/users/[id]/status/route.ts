import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  isActive: z.boolean(),
  remarks: z.string().trim().max(255).optional(),
});

export async function POST(
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

    if (sessionUser.id === targetUserId) {
      return NextResponse.json({ error: "You cannot deactivate your own administrative account." }, { status: 400 });
    }

    const body = await request.json();
    const validated = statusSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const action = validated.isActive ? "USER_REACTIVATED" : "USER_DEACTIVATED";

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: targetUserId },
        data: { isActive: validated.isActive },
      });

      await tx.organizationAuditLog.create({
        data: {
          action,
          actorId: sessionUser.id,
          targetUserId: targetUserId,
          entityType: "USER",
          entityId: targetUserId,
          previousState: { isActive: targetUser.isActive },
          newState: { isActive: validated.isActive },
          remarks: validated.remarks || `Admin ${sessionUser.name || sessionUser.username} set status to ${validated.isActive ? "ACTIVE" : "DEACTIVATED"} for ${targetUser.username}`,
        },
      });
    });

    return NextResponse.json({
      message: `User account ${validated.isActive ? "activated" : "deactivated"} successfully`,
      isActive: validated.isActive,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/admin/users/[id]/status error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
