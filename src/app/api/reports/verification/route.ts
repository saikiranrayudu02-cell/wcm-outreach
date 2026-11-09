import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { parseGeographicLocation } from "@/lib/geographic";
import { syncVerificationMedia } from "@/lib/media-sync";
import { findOrCreateMeetingPerson } from "@/lib/person-service";

function safeNumber(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

function safeBoolean(val: any): boolean | undefined {
  if (val === undefined || val === null) return undefined;
  return val === true || val === "true" || val === 1 || val === "1";
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
    const meetingId = searchParams.get("meetingId") || searchParams.get("id") || searchParams.get("reportId");

    if (!meetingId) {
      return NextResponse.json({ error: "meetingId parameter is required" }, { status: 400 });
    }

    const meeting: any = await (prisma as any).meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
      },
      include: {
        verificationSheet: {
          include: {
            media: true,
            arrangedByPerson: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: meeting.status,
      verificationSheet: meeting.verificationSheet,
    });
  } catch (err) {
    console.error("GET /api/reports/verification error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
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
    const { meetingId, submit = false, images, media, ...vData } = body;
    const mediaList = Array.isArray(images) ? images : Array.isArray(media) ? media : [];

    // Verification Images Validation
    if (submit) {
      if (mediaList.length < 1) {
        return NextResponse.json(
          { error: "Verification Images required: Please upload at least 1 image (up to 5)." },
          { status: 400 }
        );
      }
    }
    if (mediaList.length > 5) {
      return NextResponse.json(
        { error: "Maximum of 5 Verification Images allowed." },
        { status: 400 }
      );
    }

    const geo = parseGeographicLocation(vData.stateDistrictCity, user);

    let meeting: any = null;

    if (meetingId) {
      const isPrivileged = ["ADMIN", "STATE_LEADER", "ZONE_LEADER"].includes(user.role);
      meeting = await (prisma as any).meetingReport.findFirst({
        where: {
          OR: [{ id: meetingId }, { reportId: meetingId }],
          leaderId: isPrivileged ? undefined : user.id,
        },
        include: { verificationSheet: true },
      });

      if (!meeting) {
        return NextResponse.json({ error: "Meeting not found or you are not authorized" }, { status: 404 });
      }
    } else {
      // Create a new meeting for this verification sheet
      const year = new Date().getFullYear();
      const count = await (prisma as any).meetingReport.count();
      const reportId = `MR-${year}-${String(count + 1).padStart(5, "0")}`;

      meeting = await (prisma as any).meetingReport.create({
        data: {
          reportId,
          title: vData.churchMinistryName ? `${vData.churchMinistryName} Outreach` : `Outreach Meeting ${reportId}`,
          leaderId: user.id,
          status: "DRAFT",
          version: 1,
        },
      });
    }

    // Find or create Meeting Person (Arranged By / Referred By)
    let person: any = null;
    if (vData.arrangedByName || vData.arrangedByPersonId) {
      try {
        person = await findOrCreateMeetingPerson({
          personId: vData.arrangedByPersonId,
          name: vData.arrangedByName,
          phoneNumber: vData.arrangedByPhone,
          notes: vData.arrangedByNotes,
        });
      } catch (personErr) {
        console.warn("Meeting person link warning in POST /api/reports/verification:", personErr);
      }
    }

    // Upsert verification sheet
    const updatedSheet: any = await (prisma as any).verificationSheet.upsert({
      where: { meetingReportId: meeting.id },
      create: {
        meetingReportId: meeting.id,
        status: submit ? "SUBMITTED" : "PENDING",
        submittedAt: submit ? new Date() : undefined,
        convenerName: vData.convenerName || "",
        churchMinistryName: vData.churchMinistryName || "",
        stateDistrictCity: vData.stateDistrictCity || "",
        state: geo.state || null,
        zone: geo.zone || null,
        district: geo.district || null,
        part: geo.part || null,
        meetingSession: vData.meetingSession || null,
        travelMode: vData.travelMode || null,
        travelOtherDetails: vData.travelOtherDetails || null,
        stayLocation: vData.stayLocation || null,
        arrangedByPersonId: person ? person.id : vData.arrangedByPersonId || null,
        arrangedByName: person ? person.name : vData.arrangedByName || null,
        arrangedByPhone: person ? person.phoneNumber : vData.arrangedByPhone || null,
        arrangedByNotes: person ? person.notes : vData.arrangedByNotes || null,
        contactNumber: vData.contactNumber || "",
        meetingDates: vData.meetingDates || "",
        numberOfDays: safeNumber(vData.numberOfDays) ?? 0,
        expectedAttendance: safeNumber(vData.expectedAttendance) ?? 0,
        yearsOfMinistry: safeNumber(vData.yearsOfMinistry) ?? 0,
        churchMembers: safeNumber(vData.churchMembers) ?? 0,
        workersLeaders: safeNumber(vData.workersLeaders) ?? 0,
        knowAboutWcm: vData.knowAboutWcm || "",
        readWcmBooks: safeBoolean(vData.readWcmBooks) ?? false,
        attendedProphetMeeting: safeBoolean(vData.attendedProphetMeeting) ?? false,
        meetingHallStage: vData.meetingHallStage || "",
        soundSystem: vData.soundSystem || "",
        accommodationTeam: vData.accommodationTeam || "",
        volunteerSupport: vData.volunteerSupport || "",
      },
      update: {
        status: submit ? "SUBMITTED" : undefined,
        submittedAt: submit ? new Date() : undefined,
        convenerName: vData.convenerName !== undefined ? vData.convenerName : undefined,
        churchMinistryName: vData.churchMinistryName !== undefined ? vData.churchMinistryName : undefined,
        stateDistrictCity: vData.stateDistrictCity !== undefined ? vData.stateDistrictCity : undefined,
        state: geo.state || undefined,
        zone: geo.zone || undefined,
        district: geo.district || undefined,
        part: geo.part || undefined,
        meetingSession: vData.meetingSession !== undefined ? vData.meetingSession : undefined,
        travelMode: vData.travelMode !== undefined ? vData.travelMode : undefined,
        travelOtherDetails: vData.travelOtherDetails !== undefined ? vData.travelOtherDetails : undefined,
        stayLocation: vData.stayLocation !== undefined ? vData.stayLocation : undefined,
        arrangedByPersonId: person ? person.id : vData.arrangedByPersonId !== undefined ? vData.arrangedByPersonId : undefined,
        arrangedByName: person ? person.name : vData.arrangedByName !== undefined ? vData.arrangedByName : undefined,
        arrangedByPhone: person ? person.phoneNumber : vData.arrangedByPhone !== undefined ? vData.arrangedByPhone : undefined,
        arrangedByNotes: person ? person.notes : vData.arrangedByNotes !== undefined ? vData.arrangedByNotes : undefined,
        contactNumber: vData.contactNumber !== undefined ? vData.contactNumber : undefined,
        meetingDates: vData.meetingDates !== undefined ? vData.meetingDates : undefined,
        numberOfDays: safeNumber(vData.numberOfDays),
        expectedAttendance: safeNumber(vData.expectedAttendance),
        yearsOfMinistry: safeNumber(vData.yearsOfMinistry),
        churchMembers: safeNumber(vData.churchMembers),
        workersLeaders: safeNumber(vData.workersLeaders),
        knowAboutWcm: vData.knowAboutWcm !== undefined ? vData.knowAboutWcm : undefined,
        readWcmBooks: safeBoolean(vData.readWcmBooks),
        attendedProphetMeeting: safeBoolean(vData.attendedProphetMeeting),
        meetingHallStage: vData.meetingHallStage !== undefined ? vData.meetingHallStage : undefined,
        soundSystem: vData.soundSystem !== undefined ? vData.soundSystem : undefined,
        accommodationTeam: vData.accommodationTeam !== undefined ? vData.accommodationTeam : undefined,
        volunteerSupport: vData.volunteerSupport !== undefined ? vData.volunteerSupport : undefined,
      },
    });

    // Synchronize Verification Media (Images)
    if (mediaList && (mediaList.length > 0 || body.images !== undefined || body.media !== undefined)) {
      try {
        await syncVerificationMedia(updatedSheet.id, mediaList);
      } catch (mediaErr) {
        console.warn("Verification media sync warning:", mediaErr);
      }
    }

    if (submit) {
      await (prisma as any).meetingReport.update({
        where: { id: meeting.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          title: vData.churchMinistryName ? `${vData.churchMinistryName} Outreach` : undefined,
        },
      });
    }

    const actorName = user.username || user.name || "User";
    await (prisma as any).reportAuditLog.create({
      data: {
        meetingReportId: meeting.id,
        actorId: user.id,
        action: submit ? "VERIFICATION_SUBMITTED" : "VERIFICATION_SAVED",
        details: submit ? `Verification Form submitted for review by ${actorName}` : `Verification Form draft saved by ${actorName}`,
        formType: "VERIFICATION",
      },
    });

    // Synchronize into MeetingBooking system
    try {
      let bookingDate = new Date();
      if (updatedSheet.meetingDates) {
        const parsed = new Date(updatedSheet.meetingDates);
        if (!isNaN(parsed.getTime())) {
          bookingDate = parsed;
        } else if (updatedSheet.submittedAt) {
          bookingDate = new Date(updatedSheet.submittedAt);
        }
      } else if (updatedSheet.submittedAt) {
        bookingDate = new Date(updatedSheet.submittedAt);
      }
      const dateStr = bookingDate.toISOString().slice(0, 10);

      const existingBooking = await (prisma as any).meetingBooking.findFirst({
        where: { verificationSheetId: updatedSheet.id },
      });

      if (!existingBooking) {
        await (prisma as any).meetingBooking.create({
          data: {
            verificationSheetId: updatedSheet.id,
            clientName: updatedSheet.convenerName || updatedSheet.churchMinistryName || "Outreach Client",
            phoneNumber: updatedSheet.contactNumber || "N/A",
            meetingDate: bookingDate,
            meetingDateStr: dateStr,
            meetingCity: updatedSheet.stateDistrictCity || "Location",
            meetingSession: updatedSheet.meetingSession || "Morning",
            travelMode: updatedSheet.travelMode || null,
            travelOtherDetails: updatedSheet.travelOtherDetails || null,
            stayLocation: updatedSheet.stayLocation || null,
            priority: "HIGH",
            queuePosition: 1,
            status: submit ? "CONFIRMED" : "ON_HOLD",
            confirmedAt: submit ? new Date() : null,
            createdById: user.id || null,
          },
        });
      } else {
        await (prisma as any).meetingBooking.update({
          where: { id: existingBooking.id },
          data: {
            clientName: updatedSheet.convenerName || existingBooking.clientName,
            phoneNumber: updatedSheet.contactNumber || existingBooking.phoneNumber,
            meetingDate: bookingDate,
            meetingDateStr: dateStr,
            meetingCity: updatedSheet.stateDistrictCity || existingBooking.meetingCity,
            meetingSession: updatedSheet.meetingSession || existingBooking.meetingSession,
            travelMode: updatedSheet.travelMode || existingBooking.travelMode,
            travelOtherDetails: updatedSheet.travelOtherDetails || existingBooking.travelOtherDetails,
            stayLocation: updatedSheet.stayLocation || existingBooking.stayLocation,
            status: submit && existingBooking.status !== "CANCELLED" ? "CONFIRMED" : existingBooking.status,
            confirmedAt: submit && !existingBooking.confirmedAt ? new Date() : existingBooking.confirmedAt,
          },
        });
      }
    } catch (syncErr) {
      console.warn("Meeting booking sync warning:", syncErr);
    }

    return NextResponse.json({
      message: submit ? "Verification Form submitted successfully" : "Verification Form saved successfully",
      meetingId: meeting.id,
      reportId: meeting.reportId,
      status: updatedSheet.status,
    });
  } catch (err) {
    console.error("POST /api/reports/verification error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
