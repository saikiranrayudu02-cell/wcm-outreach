import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";

export const dynamic = "force-dynamic";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
    const body = await request.json();
    const validated = resetPasswordSchema.parse(body);

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 10);

    await prisma.$transaction(async (tx) => {
      // 1. Update user passwordHash
      await tx.user.update({
        where: { id: targetUserId },
        data: { passwordHash: passwordHash },
      });

      // 2. Update Better Auth account password
      await tx.account.updateMany({
        where: { userId: targetUserId, providerId: "credential" },
        data: { password: passwordHash },
      });

      // 3. Log audit event
      await tx.organizationAuditLog.create({
        data: {
          action: "PASSWORD_RESET",
          actorId: sessionUser.id,
          targetUserId: targetUserId,
          entityType: "USER",
          entityId: targetUserId,
          remarks: `Admin ${sessionUser.name || sessionUser.username} securely reset password for user '${targetUser.username}'`,
        },
      });
    });

    return NextResponse.json({
      message: `Password for ${targetUser.username} reset successfully`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("POST /api/admin/users/[id]/reset-password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
