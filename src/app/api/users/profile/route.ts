import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  phoneNumber: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").optional(),
  currentPassword: z.string().optional().nullable(),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().nullable(),
  image: z.string().optional().nullable(),
});

// GET /api/users/profile - Fetch current logged-in user's profile and stats
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

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
        updatedAt: true,
        meetingReports: {
          select: {
            id: true,
            reportId: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: {
            meetingReports: true,
            meetingConfirmations: true,
            receivedNotifications: true,
          },
        },
      } as any,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        state: user.state,
        zone: user.zone,
        part: user.part,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      stats: {
        totalReports: user._count?.meetingReports ?? 0,
        totalConfirmations: user._count?.meetingConfirmations ?? 0,
        unreadNotifications: user._count?.receivedNotifications ?? 0,
        recentReports: user.meetingReports ?? [],
      },
    });
  } catch (err: any) {
    console.error("GET /api/users/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to load profile" }, { status: 500 });
  }
}

// PUT /api/users/profile - Update user profile details (ROLE CANNOT BE EDITED)
export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Role cannot be edited by the user!
    // We strictly prepare update payload without allowing any role change.
    const updateData: any = {};

    if (validatedData.name !== undefined && validatedData.name.trim() !== "") {
      updateData.name = validatedData.name.trim();
    }

    if (validatedData.phoneNumber !== undefined) {
      updateData.phoneNumber = validatedData.phoneNumber ? validatedData.phoneNumber.trim() : null;
    }

    if (validatedData.image !== undefined) {
      updateData.image = validatedData.image;
    }

    if (validatedData.email !== undefined && validatedData.email.trim() !== "") {
      const newEmail = validatedData.email.trim().toLowerCase();
      // Check if email is already taken by another user
      if (newEmail !== existingUser.email.toLowerCase()) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email: newEmail,
            NOT: { id: userId },
          },
        });
        if (emailExists) {
          return NextResponse.json({ error: "This email address is already in use" }, { status: 400 });
        }
        updateData.email = newEmail;
      }
    }

    let newPasswordHash: string | null = null;
    if (validatedData.newPassword) {
      // If currentPassword is provided, verify it
      if (validatedData.currentPassword) {
        const isMatch = await bcrypt.compare(validatedData.currentPassword, existingUser.passwordHash);
        if (!isMatch) {
          return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
        }
      }

      newPasswordHash = await bcrypt.hash(validatedData.newPassword, 10);
      updateData.passwordHash = newPasswordHash;
    }

    // Execute in transaction to keep Better Auth account in sync
    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await (tx.user as any).update({
        where: { id: userId },
        data: updateData,
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
          updatedAt: true,
        },
      });

      // Update Better Auth account credentials if password or email changed
      if (newPasswordHash || updateData.email) {
        const accountUpdate: any = {};
        if (newPasswordHash) accountUpdate.password = newPasswordHash;
        if (updateData.email) accountUpdate.accountId = updateData.email;

        await tx.account.updateMany({
          where: { userId: userId, providerId: "credential" },
          data: accountUpdate,
        });
      }

      return u;
    });

    return NextResponse.json({
      message: "Profile details updated successfully",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("PUT /api/users/profile error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
