import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createNotificationSchema = z.object({
  recipientId: z.string().uuid().optional(),
  targetGroup: z.enum(["COORDINATOR", "STATE_LEADER", "ADMIN", "BOTH"]).optional(),
  title: z.string().min(1).max(100).default("Message Notification"),
  message: z.string().min(1).max(1000),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All users see notifications sent TO them OR sent BY them
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { recipientId: session.user.id },
          { senderId: session.user.id },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            username: true,
            name: true,
            role: true,
          },
        },
        recipient: {
          select: {
            username: true,
            name: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(notifications);
  } catch (err) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
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

    const sessionRole = (session.user as any).role;
    if (sessionRole !== "ADMIN" && sessionRole !== "STATE_LEADER" && sessionRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    const { recipientId, targetGroup, title, message } = validatedData;

    if (!recipientId && !targetGroup) {
      return NextResponse.json({ error: "Either recipientId or targetGroup must be provided" }, { status: 400 });
    }

    let recipientIdsToNotify: string[] = [];

    if (targetGroup === "BOTH") {
      // Find State Leaders (in sender's state if present) and Admins
      const stateLeaders = await prisma.user.findMany({
        where: session.user.state
          ? { role: "STATE_LEADER", state: session.user.state }
          : { role: "STATE_LEADER" },
        select: { id: true },
      });
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      recipientIdsToNotify = [
        ...stateLeaders.map((u) => u.id),
        ...admins.map((u) => u.id),
      ];
    } else if (targetGroup === "STATE_LEADER") {
      const stateLeaders = await prisma.user.findMany({
        where: session.user.state
          ? { role: "STATE_LEADER", state: session.user.state }
          : { role: "STATE_LEADER" },
        select: { id: true },
      });
      recipientIdsToNotify = stateLeaders.map((u) => u.id);
    } else if (targetGroup === "ADMIN") {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });
      recipientIdsToNotify = admins.map((u) => u.id);
    } else if (recipientId) {
      const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });
      if (!recipient) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }
      recipientIdsToNotify = [recipientId];
    }

    // Deduplicate recipient IDs and remove sender if present
    recipientIdsToNotify = Array.from(new Set(recipientIdsToNotify)).filter(
      (id) => id !== session.user.id
    );

    if (recipientIdsToNotify.length === 0) {
      return NextResponse.json({ error: "No valid recipients found for this selection" }, { status: 400 });
    }

    const createdNotifications = await prisma.$transaction(
      recipientIdsToNotify.map((recId) =>
        prisma.notification.create({
          data: {
            recipientId: recId,
            senderId: session.user.id,
            title,
            message,
          },
        })
      )
    );

    return NextResponse.json({
      message: `Message sent to ${createdNotifications.length} recipient(s)`,
      count: createdNotifications.length,
    });
  } catch (err) {
    console.error("POST /api/notifications error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
