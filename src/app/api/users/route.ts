import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  username: z.string().min(3).max(100),
  name: z.string().optional(),
  password: z.string().min(6),
  phoneNumber: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "COORDINATOR", "STATE_LEADER", "ZONE_LEADER"]),
  state: z.string().nullable().optional(),
  part: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const userRole = sessionUser.role;
    if (userRole !== "ADMIN" && userRole !== "STATE_LEADER" && userRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role")?.trim() || "";

    // Build base role-based access scope
    let baseWhere: any = {};
    if (userRole === "STATE_LEADER") {
      if (!sessionUser.state) {
        return NextResponse.json([]);
      }
      baseWhere = {
        state: sessionUser.state,
        role: { in: ["ZONE_LEADER", "COORDINATOR"] },
      };
    } else if (userRole === "ZONE_LEADER") {
      if (!sessionUser.zone) {
        return NextResponse.json([]);
      }
      baseWhere = {
        zone: sessionUser.zone,
        role: "COORDINATOR",
      };
    }

    // Role filter within allowed scope
    if (roleFilter && roleFilter !== "ALL") {
      if (userRole === "STATE_LEADER" && (roleFilter === "ZONE_LEADER" || roleFilter === "COORDINATOR")) {
        baseWhere.role = roleFilter;
      } else if (userRole === "ADMIN") {
        baseWhere.role = roleFilter;
      }
    }

    // Search by Name, Username, Phone Number, or Email
    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        state: true,
        zone: true,
        part: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            meetingReports: true,
          },
        },
      } as any,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    console.log("POST /api/users - Session User:", session?.user);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (userRole !== "ADMIN" && userRole !== "STATE_LEADER" && userRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    if (userRole === "STATE_LEADER") {
      if (validatedData.role !== "COORDINATOR" || validatedData.state !== session.user.state) {
        return NextResponse.json({ error: "Forbidden: State leaders can only create coordinators in their state" }, { status: 403 });
      }
    } else if (userRole === "ZONE_LEADER") {
      if (validatedData.role !== "COORDINATOR" || validatedData.zone !== session.user.zone) {
        return NextResponse.json({ error: "Forbidden: Zone leaders can only create coordinators in their zone" }, { status: 403 });
      }
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username: validatedData.username },
    });
    if (existing) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    const email = `${validatedData.username}@wmlrs.com`; // placeholder for Better Auth email requirement

    // Create user in transaction to ensure consistency
    const user = await prisma.$transaction(async (tx) => {
      const u = await (tx.user as any).create({
        data: {
          username: validatedData.username,
          passwordHash: passwordHash,
          role: validatedData.role,
          name: validatedData.name || validatedData.username,
          phoneNumber: validatedData.phoneNumber || null,
          email: email,
          emailVerified: true,
          state: validatedData.state || null,
          part: validatedData.part || null,
          zone: validatedData.zone || null,
        },
      });

      await tx.account.create({
        data: {
          accountId: email,
          providerId: "credential",
          userId: u.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return u;
    });

    // Remove passwordHash before returning to client
    const { passwordHash: _ph, ...safeUser } = user;

    return NextResponse.json({ 
      message: "User Created Successfully", 
      user: safeUser, 
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
