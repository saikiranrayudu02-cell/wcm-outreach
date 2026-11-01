import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { normalizePhoneNumber } from "@/lib/omnidimension";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can access Completed Verifications." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const callStatusFilter = searchParams.get("callStatus") || "ALL";
    const filterState = searchParams.get("state") || undefined;
    const filterZone = searchParams.get("zone") || undefined;
    const filterDistrict = searchParams.get("district") || undefined;
    const filterPart = searchParams.get("part") || undefined;

    const whereClause: any = {
      OR: [
        { status: "COMPLETED" },
        { meetingReport: { status: "APPROVED" } },
        { approvedAt: { not: null } },
      ],
      ...(filterState ? { state: filterState } : {}),
      ...(filterZone ? { zone: filterZone } : {}),
      ...(filterDistrict ? { district: filterDistrict } : {}),
      ...(filterPart ? { part: filterPart } : {}),
    };

    // Query all Completed/Approved Verification Sheets
    const verificationSheets: any[] = await (prisma as any).verificationSheet.findMany({
      where: whereClause,
      include: {
        meetingReport: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
                state: true,
                zone: true,
                part: true,
              },
            },
          },
        },
        callAttempts: {
          orderBy: { createdAt: "desc" },
          include: {
            initiatedBy: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { approvedAt: "desc" },
        { updatedAt: "desc" },
      ],
    });

    // Format and enrich records
    const records = verificationSheets.map((sheet: any) => {
      const latestAttempt = sheet.callAttempts?.[0] || null;
      const phoneValidation = normalizePhoneNumber(sheet.contactNumber);
      
      const totalAttempts = sheet.callAttempts.length;
      const isCurrentlyCalling = latestAttempt?.status === "DISPATCHED" || latestAttempt?.status === "IN_PROGRESS";
      const isCallCompleted = latestAttempt?.status === "COMPLETED";
      const isCallLocked = Boolean(sheet.isCallLocked);

      // Eligibility check for AI calling: Must NOT be currently calling, and NOT locked
      const isEligibleForCall = 
        Boolean(sheet.contactNumber && phoneValidation.isValid && !isCurrentlyCalling && !isCallLocked);

      return {
        id: sheet.id,
        meetingReportId: sheet.meetingReportId,
        reportId: sheet.meetingReport.reportId,
        reportTitle: sheet.meetingReport.title,
        status: sheet.status,
        convenerName: sheet.convenerName,
        churchMinistryName: sheet.churchMinistryName,
        stateDistrictCity: sheet.stateDistrictCity,
        state: sheet.state || sheet.meetingReport?.leader?.state || "Location Not Assigned",
        zone: sheet.zone || sheet.meetingReport?.leader?.zone || "General Zone",
        district: sheet.district || "General District",
        part: sheet.part || sheet.meetingReport?.leader?.part || "General Unit",
        isCallLocked,
        callLockedReason: sheet.callLockedReason || null,
        callAnsweredAt: sheet.callAnsweredAt || null,
        contactNumber: sheet.contactNumber,
        formattedPhone: phoneValidation.formattedNumber || sheet.contactNumber,
        isPhoneValid: phoneValidation.isValid,
        phoneError: phoneValidation.error,
        meetingDates: sheet.meetingDates,
        numberOfDays: sheet.numberOfDays,
        expectedAttendance: sheet.expectedAttendance,
        yearsOfMinistry: sheet.yearsOfMinistry,
        churchMembers: sheet.churchMembers,
        workersLeaders: sheet.workersLeaders,
        knowAboutWcm: sheet.knowAboutWcm,
        readWcmBooks: sheet.readWcmBooks,
        attendedProphetMeeting: sheet.attendedProphetMeeting,
        meetingHallStage: sheet.meetingHallStage,
        soundSystem: sheet.soundSystem,
        accommodationTeam: sheet.accommodationTeam,
        volunteerSupport: sheet.volunteerSupport,
        submittedAt: sheet.submittedAt,
        approvedAt: sheet.approvedAt || sheet.meetingReport.updatedAt,
        leader: sheet.meetingReport.leader,
        latestCallAttempt: latestAttempt,
        totalAttempts,
        isEligibleForCall,
        isCurrentlyCalling,
        isCallCompleted,
      };
    });

    // Apply in-memory search and status filters
    let filtered = records;

    if (search) {
      filtered = filtered.filter((r) =>
        r.convenerName.toLowerCase().includes(search) ||
        r.churchMinistryName.toLowerCase().includes(search) ||
        r.stateDistrictCity.toLowerCase().includes(search) ||
        r.state.toLowerCase().includes(search) ||
        r.district.toLowerCase().includes(search) ||
        r.contactNumber.includes(search) ||
        r.reportId.toLowerCase().includes(search)
      );
    }

    if (callStatusFilter !== "ALL") {
      filtered = filtered.filter((r) => {
        const status = r.latestCallAttempt?.status;
        if (callStatusFilter === "NOT_CALLED") return !r.latestCallAttempt;
        if (callStatusFilter === "LOCKED") return r.isCallLocked;
        if (callStatusFilter === "COMPLETED") return status === "COMPLETED";
        if (callStatusFilter === "DISPATCHED" || callStatusFilter === "IN_PROGRESS") {
          return status === "DISPATCHED" || status === "IN_PROGRESS";
        }
        if (callStatusFilter === "FAILED_OR_BUSY") {
          return status === "FAILED" || status === "BUSY" || status === "NO_ANSWER";
        }
        return status === callStatusFilter;
      });
    }

    return NextResponse.json({
      verifications: filtered,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error("Failed to fetch completed verifications:", error);
    return NextResponse.json(
      { error: "Internal server error fetching completed verifications" },
      { status: 500 }
    );
  }
}
