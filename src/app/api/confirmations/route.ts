import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createConfirmationSchema = z.object({
  meetingDates: z.string().min(1).max(100),
  location: z.string().min(1).max(200),
  expectedAttendance: z.number().int().min(1),
  message: z.string().min(1).max(1000),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    if (role === "ADMIN") {
      const confirmations = await prisma.meetingConfirmation.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          leader: {
            select: {
              username: true,
              name: true,
              state: true,
              part: true,
              zone: true,
            },
          },
        },
      });
      return NextResponse.json(confirmations);
    } else if (role === "STATE_LEADER") {
      const confirmations = await prisma.meetingConfirmation.findMany({
        where: {
          leader: {
            state: session.user.state
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          leader: {
            select: {
              username: true,
              name: true,
              state: true,
              part: true,
              zone: true,
            },
          },
        },
      });
      return NextResponse.json(confirmations);
    } else if (role === "ZONE_LEADER") {
      const confirmations = await prisma.meetingConfirmation.findMany({
        where: {
          leader: {
            zone: session.user.zone
          }
        },
        orderBy: { createdAt: "desc" },
        include: {
          leader: {
            select: {
              username: true,
              name: true,
              state: true,
              part: true,
              zone: true,
            },
          },
        },
      });
      return NextResponse.json(confirmations);
    } else {
      const confirmations = await prisma.meetingConfirmation.findMany({
        where: { leaderId: session.user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(confirmations);
    }
  } catch (err) {
    console.error("GET /api/confirmations error:", err);
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

    const role = (session.user as any).role;
    if (role !== "COORDINATOR" && role !== "LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createConfirmationSchema.parse(body);

    const confirmation = await prisma.meetingConfirmation.create({
      data: {
        leaderId: session.user.id,
        meetingDates: validatedData.meetingDates,
        location: validatedData.location,
        expectedAttendance: validatedData.expectedAttendance,
        message: validatedData.message,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      message: "Meeting confirmation request submitted",
      confirmation,
    });
  } catch (err) {
    console.error("POST /api/confirmations error:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
