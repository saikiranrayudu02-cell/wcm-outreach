import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Helper to auto-sync existing completed verification sheets into MeetingBookings
 */
async function syncVerificationSheetsToBookings(userId: string) {
  try {
    const sheets = await prisma.verificationSheet.findMany({
      where: {
        OR: [
          { status: "COMPLETED" },
          { meetingReport: { status: "APPROVED" } },
          { approvedAt: { not: null } },
        ],
        meetingBookings: { none: {} },
      },
      include: {
        meetingReport: true,
      },
      take: 20,
    });

    for (const sheet of sheets) {
      const fallbackDate = sheet.approvedAt || sheet.submittedAt || sheet.createdAt;
      const dateStr = fallbackDate ? new Date(fallbackDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      const meetingDate = fallbackDate ? new Date(fallbackDate) : new Date();

      await prisma.meetingBooking.create({
        data: {
          verificationSheetId: sheet.id,
          clientName: sheet.convenerName || sheet.churchMinistryName || "Outreach Client",
          phoneNumber: sheet.contactNumber || "N/A",
          meetingDate,
          meetingDateStr: dateStr,
          meetingCity: sheet.stateDistrictCity || "Main Location",
          meetingSession: sheet.meetingSession || "Morning",
          travelMode: sheet.travelMode || null,
          travelOtherDetails: sheet.travelOtherDetails || null,
          stayLocation: sheet.stayLocation || null,
          additionalNotes: `Auto-synced from approved Verification Report ${sheet.meetingReport.reportId}`,
          priority: "HIGH",
          queuePosition: 1,
          status: "CONFIRMED",
          confirmedAt: sheet.approvedAt || new Date(),
          createdById: userId,
        },
      });
    }
  } catch (err) {
    console.error("Auto-sync error (non-fatal):", err);
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const monthStr = searchParams.get("month"); // YYYY-MM
    const status = searchParams.get("status") || "ALL";
    const sessionFilter = searchParams.get("session") || "ALL";
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    // Sync any unlinked verified sheets once
    await syncVerificationSheetsToBookings(session.user.id);

    const where: any = {};

    if (dateStr) {
      where.meetingDateStr = dateStr;
    } else if (monthStr) {
      where.meetingDateStr = {
        startsWith: monthStr,
      };
    }

    if (status !== "ALL") {
      where.status = status;
    }

    if (sessionFilter !== "ALL") {
      where.meetingSession = sessionFilter;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { meetingCity: { contains: search, mode: "insensitive" } },
        { stayLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    const bookings = await prisma.meetingBooking.findMany({
      where,
      orderBy: [
        { meetingDateStr: "asc" },
        { priority: "desc" },
        { queuePosition: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        verificationSheet: {
          select: {
            id: true,
            convenerName: true,
            churchMinistryName: true,
            meetingDates: true,
            expectedAttendance: true,
            status: true,
            meetingReport: {
              select: {
                reportId: true,
                title: true,
              },
            },
            callAttempts: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            changedBy: {
              select: {
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      bookings,
      total: bookings.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching bookings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await request.json();

    const {
      clientName,
      phoneNumber,
      email,
      meetingDateStr,
      meetingCity,
      meetingSession = "Morning",
      travelMode,
      travelOtherDetails,
      stayLocation,
      additionalNotes,
      holdReason,
      priority = "MEDIUM",
      status = "ON_HOLD", // "CONFIRMED" | "ON_HOLD"
      verificationSheetId,
    } = body;

    if (!clientName || !phoneNumber || !meetingDateStr || !meetingCity) {
      return NextResponse.json(
        { error: "Missing required fields: Client Name, Phone, Date, and Location are required." },
        { status: 400 }
      );
    }

    // Availability & Conflict Check for CONFIRMED status
    if (status === "CONFIRMED") {
      const existingConfirmed = await prisma.meetingBooking.findFirst({
        where: {
          meetingDateStr,
          meetingSession,
          status: "CONFIRMED",
        },
      });

      if (existingConfirmed) {
        return NextResponse.json(
          {
            error: `Conflict: ${meetingSession} session on ${meetingDateStr} is already confirmed for ${existingConfirmed.clientName}.`,
            conflict: true,
            existingBooking: existingConfirmed,
            suggestion: "You can add this client to the Hold List for this date/session.",
          },
          { status: 409 }
        );
      }
    }

    // Determine queue position if ON_HOLD
    let queuePosition = 1;
    if (status === "ON_HOLD") {
      const existingHoldCount = await prisma.meetingBooking.count({
        where: {
          meetingDateStr,
          meetingSession,
          status: "ON_HOLD",
        },
      });
      queuePosition = existingHoldCount + 1;
    }

    const meetingDate = new Date(meetingDateStr);

    const booking = await prisma.$transaction(async (tx) => {
      const newBooking = await tx.meetingBooking.create({
        data: {
          clientName: clientName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email?.trim() || null,
          meetingDate,
          meetingDateStr,
          meetingCity: meetingCity.trim(),
          meetingSession,
          travelMode: travelMode || null,
          travelOtherDetails: travelOtherDetails || null,
          stayLocation: stayLocation?.trim() || null,
          additionalNotes: additionalNotes?.trim() || null,
          holdReason: holdReason?.trim() || null,
          priority,
          queuePosition,
          status,
          confirmedAt: status === "CONFIRMED" ? new Date() : null,
          verificationSheetId: verificationSheetId || null,
          createdById: user.id,
        },
      });

      // Audit log entry
      await tx.meetingBookingAudit.create({
        data: {
          meetingBookingId: newBooking.id,
          previousStatus: null,
          newStatus: status,
          changedById: user.id,
          reason: status === "ON_HOLD" ? (holdReason || "Added to Hold List") : "Created directly as Confirmed",
        },
      });

      return newBooking;
    });

    return NextResponse.json({
      message: status === "CONFIRMED" ? "Meeting booking confirmed successfully" : "Client successfully added to Hold List",
      booking,
    });
  } catch (error: any) {
    console.error("POST /api/admin/bookings error:", error);
    return NextResponse.json(
      { error: "Failed to create meeting booking: " + error.message },
      { status: 500 }
    );
  }
}

