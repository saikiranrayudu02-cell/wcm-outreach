import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
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

    const { id } = await props.params;

    const booking = await prisma.meetingBooking.findUnique({
      where: { id },
      include: {
        verificationSheet: true,
        auditLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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

    const user = session.user as any;
    const { id } = await props.params;
    const body = await request.json();
    const { action, reason, ...updateFields } = body;

    const existingBooking = await prisma.meetingBooking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 1. ACTION: CONFIRM (Hold-to-Confirmed conversion or explicit confirmation)
    if (action === "CONFIRM") {
      const targetSession = updateFields.meetingSession || existingBooking.meetingSession;
      const targetDateStr = updateFields.meetingDateStr || existingBooking.meetingDateStr;

      // Concurrency safe check within Prisma transaction
      const result = await prisma.$transaction(async (tx) => {
        const conflictingConfirmed = await tx.meetingBooking.findFirst({
          where: {
            meetingDateStr: targetDateStr,
            meetingSession: targetSession,
            status: "CONFIRMED",
            id: { not: id },
          },
        });

        if (conflictingConfirmed) {
          throw new Error(
            `Conflict: ${targetSession} session on ${targetDateStr} is already confirmed for "${conflictingConfirmed.clientName}". Please cancel the existing meeting first or choose another session.`
          );
        }

        const confirmedBooking = await tx.meetingBooking.update({
          where: { id },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
            cancelledAt: null,
            cancelledReason: null,
            meetingSession: targetSession,
            meetingDateStr: targetDateStr,
          },
        });

        await tx.meetingBookingAudit.create({
          data: {
            meetingBookingId: id,
            previousStatus: existingBooking.status,
            newStatus: "CONFIRMED",
            changedById: user.id,
            reason: reason || "Administrator approved booking and converted to CONFIRMED",
          },
        });

        return confirmedBooking;
      });

      return NextResponse.json({
        message: `Successfully confirmed meeting for ${result.clientName}!`,
        booking: result,
      });
    }

    // 2. ACTION: CANCEL (Cancel a Confirmed or Hold meeting)
    if (action === "CANCEL") {
      const cancelledBooking = await prisma.$transaction(async (tx) => {
        const updated = await tx.meetingBooking.update({
          where: { id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledReason: reason || "Meeting cancelled by administrator",
          },
        });

        await tx.meetingBookingAudit.create({
          data: {
            meetingBookingId: id,
            previousStatus: existingBooking.status,
            newStatus: "CANCELLED",
            changedById: user.id,
            reason: reason || "Meeting cancelled",
          },
        });

        return updated;
      });

      return NextResponse.json({
        message: `Meeting for ${cancelledBooking.clientName} has been cancelled. Associated Hold list clients can now be confirmed.`,
        booking: cancelledBooking,
      });
    }

    // 3. ACTION: HOLD (Move back to Hold queue)
    if (action === "HOLD") {
      const holdBooking = await prisma.$transaction(async (tx) => {
        const existingCount = await tx.meetingBooking.count({
          where: {
            meetingDateStr: existingBooking.meetingDateStr,
            meetingSession: existingBooking.meetingSession,
            status: "ON_HOLD",
            id: { not: id },
          },
        });

        const updated = await tx.meetingBooking.update({
          where: { id },
          data: {
            status: "ON_HOLD",
            queuePosition: existingCount + 1,
            holdReason: reason || existingBooking.holdReason,
          },
        });

        await tx.meetingBookingAudit.create({
          data: {
            meetingBookingId: id,
            previousStatus: existingBooking.status,
            newStatus: "ON_HOLD",
            changedById: user.id,
            reason: reason || "Moved to Hold list",
          },
        });

        return updated;
      });

      return NextResponse.json({
        message: `Booking for ${holdBooking.clientName} is now ON HOLD.`,
        booking: holdBooking,
      });
    }

    // 4. ACTION: UPDATE (Edit details, priority, notes)
    const updated = await prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.meetingBooking.update({
        where: { id },
        data: {
          clientName: updateFields.clientName !== undefined ? updateFields.clientName : undefined,
          phoneNumber: updateFields.phoneNumber !== undefined ? updateFields.phoneNumber : undefined,
          email: updateFields.email !== undefined ? updateFields.email : undefined,
          meetingCity: updateFields.meetingCity !== undefined ? updateFields.meetingCity : undefined,
          meetingSession: updateFields.meetingSession !== undefined ? updateFields.meetingSession : undefined,
          travelMode: updateFields.travelMode !== undefined ? updateFields.travelMode : undefined,
          travelOtherDetails: updateFields.travelOtherDetails !== undefined ? updateFields.travelOtherDetails : undefined,
          stayLocation: updateFields.stayLocation !== undefined ? updateFields.stayLocation : undefined,
          additionalNotes: updateFields.additionalNotes !== undefined ? updateFields.additionalNotes : undefined,
          holdReason: updateFields.holdReason !== undefined ? updateFields.holdReason : undefined,
          priority: updateFields.priority !== undefined ? updateFields.priority : undefined,
          queuePosition: updateFields.queuePosition !== undefined ? Number(updateFields.queuePosition) : undefined,
        },
      });

      if (reason) {
        await tx.meetingBookingAudit.create({
          data: {
            meetingBookingId: id,
            previousStatus: existingBooking.status,
            newStatus: existingBooking.status,
            changedById: user.id,
            reason: `Details updated: ${reason}`,
          },
        });
      }

      return updatedRecord;
    });

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/bookings/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

