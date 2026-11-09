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

    const { id: personId } = await props.params;
    const db = prisma as any;

    const person = await db.meetingPerson.findUnique({
      where: { id: personId },
      include: {
        verificationSheets: {
          include: {
            meetingReport: {
              include: {
                leader: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    role: true,
                  },
                },
                attendanceRecord: {
                  select: {
                    id: true,
                    status: true,
                    date: true,
                    location: true,
                    membersAttended: true,
                    pastorsAttended: true,
                  },
                },
                afterMeetingReport: {
                  select: {
                    id: true,
                    status: true,
                    submissionDate: true,
                    coordinatorName: true,
                    _count: {
                      select: { media: true },
                    },
                  },
                },
              },
            },
            meetingBookings: {
              select: {
                id: true,
                status: true,
                priority: true,
                queuePosition: true,
                meetingSession: true,
                travelMode: true,
                stayLocation: true,
              },
            },
            _count: {
              select: { media: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Dynamic Statistics Calculation
    const sheets = person.verificationSheets || [];
    const totalMeetings = sheets.length;

    let completedMeetings = 0;
    let upcomingMeetings = 0;
    let cancelledMeetings = 0;
    let onHoldMeetings = 0;
    const meetingDatesList: Date[] = [];

    const formattedMeetings = sheets.map((sheet: any) => {
      const meeting = sheet.meetingReport;
      const booking = sheet.meetingBookings?.[0];

      // Form statuses
      const vStatus = sheet.status || "PENDING";
      const aStatus = meeting?.attendanceRecord?.status || "PENDING";
      const eStatus = meeting?.afterMeetingReport?.status || "PENDING";

      // Overall booking status
      const bookingStatus = booking?.status || (vStatus === "COMPLETED" ? "CONFIRMED" : vStatus === "REJECTED" ? "CANCELLED" : "ON_HOLD");

      if (vStatus === "COMPLETED" && (aStatus === "COMPLETED" || eStatus === "COMPLETED")) {
        completedMeetings++;
      } else if (bookingStatus === "CANCELLED") {
        cancelledMeetings++;
      } else if (bookingStatus === "ON_HOLD") {
        onHoldMeetings++;
      } else {
        upcomingMeetings++;
      }

      // Collect meeting date
      let parsedDate = null;
      if (sheet.meetingDates) {
        const d = new Date(sheet.meetingDates);
        if (!isNaN(d.getTime())) {
          parsedDate = d;
          meetingDatesList.push(d);
        }
      }
      if (!parsedDate && sheet.createdAt) {
        meetingDatesList.push(new Date(sheet.createdAt));
      }

      return {
        meetingId: meeting?.id || sheet.meetingReportId,
        reportId: meeting?.reportId || "N/A",
        title: meeting?.title || sheet.churchMinistryName || "Outreach Meeting",
        meetingStatus: meeting?.status || "DRAFT",
        bookingStatus,
        convenerName: sheet.convenerName,
        churchMinistryName: sheet.churchMinistryName,
        meetingCity: sheet.stateDistrictCity,
        state: sheet.state,
        zone: sheet.zone,
        district: sheet.district,
        meetingDates: sheet.meetingDates,
        meetingSession: sheet.meetingSession || booking?.meetingSession || "Morning",
        travelMode: sheet.travelMode || booking?.travelMode || "Not Specified",
        stayLocation: sheet.stayLocation || booking?.stayLocation || null,
        verificationStatus: vStatus,
        attendanceStatus: aStatus,
        evaluationStatus: eStatus,
        verificationMediaCount: sheet._count?.media || 0,
        evaluationMediaCount: meeting?.afterMeetingReport?._count?.media || 0,
        createdAt: sheet.createdAt,
        leaderName: meeting?.leader?.name || meeting?.leader?.username || "Leader",
      };
    });

    meetingDatesList.sort((a, b) => a.getTime() - b.getTime());
    const firstMeetingDate = meetingDatesList.length > 0 ? meetingDatesList[0] : null;
    const latestMeetingDate = meetingDatesList.length > 0 ? meetingDatesList[meetingDatesList.length - 1] : null;

    return NextResponse.json({
      person: {
        id: person.id,
        name: person.name,
        phoneNumber: person.phoneNumber,
        notes: person.notes,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt,
      },
      stats: {
        totalMeetings,
        completedMeetings,
        upcomingMeetings,
        cancelledMeetings,
        onHoldMeetings,
        firstMeetingDate,
        latestMeetingDate,
      },
      meetings: formattedMeetings,
    });
  } catch (error: any) {
    console.error("GET /api/admin/persons/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch person details" }, { status: 500 });
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

    const { id } = await props.params;
    const body = await request.json();
    const { name, phoneNumber, notes } = body;

    const db = prisma as any;
    const updated = await db.meetingPerson.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber.trim() || null : undefined,
        notes: notes !== undefined ? notes.trim() || null : undefined,
      },
    });

    return NextResponse.json({ person: updated, message: "Person updated successfully" });
  } catch (error: any) {
    console.error("PATCH /api/admin/persons/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update person" }, { status: 500 });
  }
}

