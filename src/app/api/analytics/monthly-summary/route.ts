import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getMeetingDate(r: any): Date {
  if (r.attendanceRecord?.date) {
    const d = new Date(r.attendanceRecord.date);
    if (!isNaN(d.getTime())) return d;
  }
  if (r.afterMeetingReport?.submissionDate) {
    const d = new Date(r.afterMeetingReport.submissionDate);
    if (!isNaN(d.getTime())) return d;
  }
  if (r.submittedAt) {
    const d = new Date(r.submittedAt);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date(r.createdAt);
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, state: userState, zone: userZone, id: userId } = session.user;
    if (role !== "STATE_LEADER" && role !== "ZONE_LEADER" && role !== "ADMIN" && role !== "COORDINATOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonthStr = searchParams.get("month");
    const filterYearStr = searchParams.get("year");

    const now = new Date();
    const filterMonth = filterMonthStr ? parseInt(filterMonthStr) : now.getMonth() + 1;
    const filterYear = filterYearStr ? parseInt(filterYearStr) : now.getFullYear();

    // 1. Build MeetingReport query based on role
    // Match any report that has attendance or evaluation data entered or submitted
    const whereClause: any = {
      OR: [
        { attendanceRecord: { isNot: null } },
        { afterMeetingReport: { isNot: null } },
      ],
    };

    if (role === "COORDINATOR") {
      whereClause.leaderId = userId;
    } else if (role === "STATE_LEADER") {
      if (!userState) {
        return NextResponse.json({
          summary: { 
            totalMeetings: 0, 
            totalMembersAttended: 0, 
            totalPastorsAttended: 0, 
            totalHeadcount: 0, 
            totalWcmFollowers: 0, 
            avgAttendance: 0,
            interestedFellowshipCount: 0 
          },
          pieChartData: [],
          barChartData: [],
          meetings: [],
          allYearMeetings: [],
        });
      }
      whereClause.leader = { state: userState };
    } else if (role === "ZONE_LEADER") {
      if (!userZone) {
        return NextResponse.json({
          summary: { 
            totalMeetings: 0, 
            totalMembersAttended: 0, 
            totalPastorsAttended: 0, 
            totalHeadcount: 0, 
            totalWcmFollowers: 0, 
            avgAttendance: 0,
            interestedFellowshipCount: 0 
          },
          pieChartData: [],
          barChartData: [],
          meetings: [],
          allYearMeetings: [],
        });
      }
      whereClause.leader = { zone: userZone };
    } else if (role === "ADMIN") {
      // Admin sees all reports across all regions
    }

    const dbReports = await prisma.meetingReport.findMany({
      where: whereClause,
      include: {
        leader: {
          select: {
            username: true,
            role: true,
            state: true,
            part: true,
            zone: true,
            name: true,
          },
        },
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Map and extract unified metrics from Attendance & After Meeting forms
    const mappedReports = dbReports.map((r) => {
      const meetingDate = getMeetingDate(r);
      const members = Number(r.attendanceRecord?.membersAttended) || 0;
      const pastors = Number(r.attendanceRecord?.pastorsAttended) || 0;
      const totalAttended = members + pastors;
      const followers = Number(r.afterMeetingReport?.followingWcmMembersCount) || 0;
      const location = r.attendanceRecord?.location || r.verificationSheet?.stateDistrictCity || "Venue Not Specified";
      const churchName = r.verificationSheet?.churchMinistryName || r.title || `Outreach Meeting ${r.reportId}`;

      return {
        id: r.id,
        reportId: r.reportId,
        title: r.title || churchName,
        churchMinistryName: r.verificationSheet?.churchMinistryName || "N/A",
        convenerName: r.verificationSheet?.convenerName || "N/A",
        contactNumber: r.verificationSheet?.contactNumber || "N/A",
        meetingDates: r.verificationSheet?.meetingDates || "N/A",
        numberOfDays: r.verificationSheet?.numberOfDays || 1,
        date: meetingDate.toISOString(),
        year: meetingDate.getFullYear(),
        month: meetingDate.getMonth() + 1,
        location,
        fieldExecuter: r.attendanceRecord?.fieldExecuter || "N/A",
        coordinator: r.attendanceRecord?.coordinator || r.leader?.name || r.leader?.username || "N/A",
        membersAttended: members,
        pastorsAttended: pastors,
        totalAttended,
        remarks: r.attendanceRecord?.remarks || "",
        overallMeetingOutcome: r.afterMeetingReport?.overallMeetingOutcome || "N/A",
        congregationResponse: r.afterMeetingReport?.congregationResponse || "N/A",
        continueFellowship: r.afterMeetingReport?.continueFellowship ?? null,
        followingWcmMembersCount: followers,
        localChurchInfluence: r.afterMeetingReport?.localChurchInfluence || "N/A",
        networkOfPastors: r.afterMeetingReport?.networkOfPastors || "N/A",
        futureOpportunities: r.afterMeetingReport?.futureOpportunities || [],
        strengthsObserved: r.afterMeetingReport?.strengthsObserved || "",
        challengesObserved: r.afterMeetingReport?.challengesObserved || "",
        opportunityForWcm: r.afterMeetingReport?.opportunityForWcm || "",
        evalCoordinatorName: r.afterMeetingReport?.coordinatorName || "",
        designation: r.afterMeetingReport?.designation || "",
        signature: r.afterMeetingReport?.signature || "",
        verificationStatus: r.verificationSheet?.status || "PENDING",
        attendanceStatus: r.attendanceRecord?.status || "PENDING",
        evaluationStatus: r.afterMeetingReport?.status || "PENDING",
        reportStatus: r.status,
        leader: r.leader,
      };
    });

    // 3. Filter reports by target year
    const reportsInYear = mappedReports.filter((r) => r.year === filterYear);

    // 4. Filter reports by target month
    const reportsInMonth = reportsInYear.filter((r) => r.month === filterMonth);

    const totalMeetings = reportsInMonth.length;
    const totalMembersAttended = reportsInMonth.reduce((sum, r) => sum + r.membersAttended, 0);
    const totalPastorsAttended = reportsInMonth.reduce((sum, r) => sum + r.pastorsAttended, 0);
    const totalHeadcount = reportsInMonth.reduce((sum, r) => sum + r.totalAttended, 0);
    const totalWcmFollowers = reportsInMonth.reduce((sum, r) => sum + r.followingWcmMembersCount, 0);
    const avgAttendance = totalMeetings > 0 ? Math.round(totalHeadcount / totalMeetings) : 0;
    const interestedFellowshipCount = reportsInMonth.filter((r) => r.continueFellowship === true).length;

    // 5. Calculate Location Coverage (Pie Chart Data)
    const locationCounts: Record<string, number> = {};
    reportsInMonth.forEach((r) => {
      const loc = r.location || "Unknown Location";
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const pieChartData = Object.entries(locationCounts).map(([name, count]) => {
      const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
      return { name, count, percentage };
    });

    // 6. Calculate Monthly Trends for all 12 months (Bar Chart Data)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const barChartData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const reportsForMonth = reportsInYear.filter((r) => r.month === monthNum);

      const meetingsCount = reportsForMonth.length;
      const membersCount = reportsForMonth.reduce((sum, r) => sum + r.membersAttended, 0);
      const pastorsCount = reportsForMonth.reduce((sum, r) => sum + r.pastorsAttended, 0);
      const attendeesCount = reportsForMonth.reduce((sum, r) => sum + r.totalAttended, 0);
      const followersCount = reportsForMonth.reduce((sum, r) => sum + r.followingWcmMembersCount, 0);

      return {
        month: name,
        meetings: meetingsCount,
        members: membersCount,
        pastors: pastorsCount,
        attendees: attendeesCount,
        followers: followersCount,
      };
    });

    return NextResponse.json({
      summary: {
        totalMeetings,
        totalMembersAttended,
        totalPastorsAttended,
        totalHeadcount,
        totalWcmFollowers,
        avgAttendance,
        interestedFellowshipCount,
      },
      pieChartData,
      barChartData,
      meetings: reportsInMonth,
      allYearMeetings: reportsInYear,
      filterMonth,
      filterYear,
    });
  } catch (err) {
    console.error("Analytics monthly summary failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
