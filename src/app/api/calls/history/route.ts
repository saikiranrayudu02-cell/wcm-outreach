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

    const { role } = session.user as any;
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can view call history." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const verificationSheetId = searchParams.get("verificationSheetId");
    const callAttemptId = searchParams.get("callAttemptId");
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const where: any = {};
    if (verificationSheetId) {
      where.verificationSheetId = verificationSheetId;
    }
    if (callAttemptId) {
      where.id = callAttemptId;
    }

    const attempts = await (prisma as any).callAttempt.findMany({
      where,
      include: {
        initiatedBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        verificationSheet: {
          select: {
            id: true,
            convenerName: true,
            churchMinistryName: true,
            contactNumber: true,
            stateDistrictCity: true,
            meetingDates: true,
            expectedAttendance: true,
            status: true,
            meetingReport: {
              select: {
                id: true,
                reportId: true,
                title: true,
              },
            },
          },
        },
        parentAttempt: {
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            initiatedAt: true,
          },
        },
        retryAttempts: {
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            initiatedAt: true,
          },
          orderBy: {
            attemptNumber: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json({
      attempts,
      total: attempts.length,
    });
  } catch (error: any) {
    console.error("Error fetching call history:", error);
    return NextResponse.json(
      { error: "Internal server error fetching call history." },
      { status: 500 }
    );
  }
}
