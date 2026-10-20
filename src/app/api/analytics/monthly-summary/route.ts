import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, state: userState, zone: userZone } = session.user;
    if (role !== "STATE_LEADER" && role !== "ZONE_LEADER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filterMonthStr = searchParams.get("month");
    const filterYearStr = searchParams.get("year");

    const now = new Date();
    const filterMonth = filterMonthStr ? parseInt(filterMonthStr) : now.getMonth() + 1;
    const filterYear = filterYearStr ? parseInt(filterYearStr) : now.getFullYear();

    // 1. Build MeetingReport query based on role
    let leaderWhereClause: any = {};
    const whereClause: any = { status: "APPROVED" };

    if (role === "STATE_LEADER") {
      if (!userState) {
        return NextResponse.json({
          summary: { totalMeetings: 0, totalMembersAttended: 0, totalWcmFollowers: 0 },
          pieChartData: [],
          barChartData: [],
        });
      }
      leaderWhereClause = { state: userState };
    } else if (role === "ZONE_LEADER") {
      if (!userZone) {
        return NextResponse.json({
          summary: { totalMeetings: 0, totalMembersAttended: 0, totalWcmFollowers: 0 },
          pieChartData: [],
          barChartData: [],
        });
      }
      leaderWhereClause = { zone: userZone };
    } else if (role === "ADMIN") {
      // Admin sees all approved reports
    }

    if (Object.keys(leaderWhereClause).length > 0) {
      whereClause.leader = leaderWhereClause;
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
          },
        },
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
      },
    });

    // Map into the format expected by the calculations below
    const allReports = dbReports.map((r) => ({
      verification: r.verificationSheet,
      attendance: r.attendanceRecord,
      afterMeeting: r.afterMeetingReport,
    }));

    // 3. Filter reports by target year
    const reportsInYear = allReports.filter((r) => {
      if (!r.attendance || !r.attendance.date) return false;
      const attDate = new Date(r.attendance.date);
      return attDate.getFullYear() === filterYear;
    });

    // 4. Calculate monthly card stats & pie chart stats
    const reportsInMonth = reportsInYear.filter((r) => {
      const attDate = new Date(r.attendance!.date);
      return attDate.getMonth() + 1 === filterMonth;
    });

    const totalMeetings = reportsInMonth.length;
    const totalMembersAttended = reportsInMonth.reduce(
      (sum, r) => sum + (r.attendance?.membersAttended || 0),
      0
    );
    const totalWcmFollowers = reportsInMonth.reduce(
      (sum, r) => sum + (r.afterMeeting?.followingWcmMembersCount || 0),
      0
    );

    // 5. Calculate Location Coverage (Pie Chart Data)
    const locationCounts: Record<string, number> = {};
    reportsInMonth.forEach((r) => {
      const loc = r.attendance?.location || "Unknown";
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const pieChartData = Object.entries(locationCounts).map(([name, count]) => {
      const percentage = totalMeetings > 0 ? Math.round((count / totalMeetings) * 100) : 0;
      return { name, count, percentage };
    });

    // 6. Calculate Monthly Trend Trends (Bar Chart Data)
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const barChartData = monthNames.map((name, index) => {
      const monthNum = index + 1;
      const reportsForMonth = reportsInYear.filter((r) => {
        const attDate = new Date(r.attendance!.date);
        return attDate.getMonth() + 1 === monthNum;
      });

      const meetingsCount = reportsForMonth.length;
      const attendeesCount = reportsForMonth.reduce(
        (sum, r) => sum + (r.attendance?.membersAttended || 0),
        0
      );

      return {
        month: name,
        meetings: meetingsCount,
        attendees: attendeesCount,
      };
    });

    return NextResponse.json({
      summary: {
        totalMeetings,
        totalMembersAttended,
        totalWcmFollowers,
      },
      pieChartData,
      barChartData,
    });
  } catch (err) {
    console.error("Analytics summary failed", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
