import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { findOrCreateMeetingPerson } from "@/lib/person-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

    const db = prisma as any;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
      ];
    }

    const persons = await db.meetingPerson.findMany({
      where,
      take: limit,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { verificationSheets: true },
        },
      },
    });

    const formatted = persons.map((p: any) => ({
      id: p.id,
      name: p.name,
      phoneNumber: p.phoneNumber,
      notes: p.notes,
      totalMeetings: p._count?.verificationSheets || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({ persons: formatted });
  } catch (error: any) {
    console.error("GET /api/admin/persons error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch persons" }, { status: 500 });
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

    const body = await request.json();
    const { name, phoneNumber, notes, personId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Person Name is mandatory" }, { status: 400 });
    }

    const person = await findOrCreateMeetingPerson({
      personId,
      name,
      phoneNumber,
      notes,
    });

    return NextResponse.json({ person, message: "Person record saved successfully" });
  } catch (error: any) {
    console.error("POST /api/admin/persons error:", error);
    return NextResponse.json({ error: error.message || "Failed to save person" }, { status: 500 });
  }
}

