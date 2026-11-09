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

    const { id: meetingId } = await props.params;
    const db = prisma as any;

    const meeting = await db.meetingReport.findFirst({
      where: {
        OR: [{ id: meetingId }, { reportId: meetingId }],
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
            phoneNumber: true,
            state: true,
            zone: true,
          },
        },
        verificationSheet: {
          include: {
            media: {
              orderBy: { sortOrder: "asc" },
            },
            arrangedByPerson: true,
            meetingBookings: true,
            callAttempts: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
        attendanceRecord: true,
        afterMeetingReport: {
          include: {
            media: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        auditLogs: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reviewerComments: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting record not found" }, { status: 404 });
    }

    return NextResponse.json({ meeting });
  } catch (error: any) {
    console.error("GET /api/admin/meetings/[id]/full-history error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch meeting history" }, { status: 500 });
  }
}

