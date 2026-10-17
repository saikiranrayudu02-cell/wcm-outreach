import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reviewConfirmationSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminFeedback: z.string().max(1000).optional(),
});

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "STATE_LEADER" && userRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;

    const body = await request.json();
    const validatedData = reviewConfirmationSchema.parse(body);

    // Find the confirmation request
    const existing = await prisma.meetingConfirmation.findUnique({
      where: { id },
      include: {
        leader: true,
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Confirmation request not found" }, { status: 404 });
    }

    if (userRole === "STATE_LEADER") {
      if (existing.leader.state !== session.user.state) {
        return NextResponse.json({ error: "Forbidden: Coordinator belongs to another state" }, { status: 403 });
      }
    } else if (userRole === "ZONE_LEADER") {
      if (existing.leader.zone !== session.user.zone) {
        return NextResponse.json({ error: "Forbidden: Coordinator belongs to another zone" }, { status: 403 });
      }
    }

    // Update DB
    const updated = await prisma.meetingConfirmation.update({
      where: { id },
      data: {
        status: validatedData.status,
        adminFeedback: validatedData.adminFeedback || null,
      },
    });

    // Create an automatic notification for the leader
    await prisma.notification.create({
      data: {
        recipientId: updated.leaderId,
        senderId: session.user.id,
        title: `Meeting Proposal ${validatedData.status === "APPROVED" ? "APPROVED" : "REJECTED"}`,
        message: `Your meeting proposal for "${updated.meetingDates}" at "${updated.location}" has been ${validatedData.status === "APPROVED" ? "approved" : "rejected"}.${validatedData.adminFeedback ? ` Comments: "${validatedData.adminFeedback}"` : ""}`,
      },
    });

    return NextResponse.json({
      message: `Meeting request ${validatedData.status.toLowerCase()} successfully`,
      confirmation: updated,
    });
  } catch (err) {
    console.error("PUT /api/confirmations/[id] error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
