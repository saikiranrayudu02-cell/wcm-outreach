import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";
import { validateHierarchyScope, getActiveZonalLeader, getActiveStateLeader, logOrganizationAction } from "@/lib/hierarchy";

export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Full Name must be at least 2 characters").max(100),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50).regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain alphanumeric characters, underscores, dashes, and periods"),
  email: z.string().email("Valid email required").optional().nullable(),
  phoneNumber: z.string().trim().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6).optional(),
  role: z.enum(["STATE_LEADER", "ZONE_LEADER", "COORDINATOR"]),
  stateId: z.string().uuid("State is required"),
  zoneId: z.string().uuid().optional().nullable(),
  newZoneName: z.string().trim().max(100).optional().nullable(),
  districtId: z.string().uuid().optional().nullable(),
  newDistrictName: z.string().trim().max(100).optional().nullable(),
  replaceExistingLeader: z.boolean().optional().default(false),
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
    const { role: sessionRole, state: userState, zone: userZone, id: sessionUserId } = sessionUser;

    if (sessionRole !== "ADMIN" && sessionRole !== "STATE_LEADER" && sessionRole !== "ZONE_LEADER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role")?.trim() || "";
    const stateFilter = searchParams.get("stateId")?.trim() || searchParams.get("state")?.trim() || "";
    const zoneFilter = searchParams.get("zoneId")?.trim() || searchParams.get("zone")?.trim() || "";
    const districtFilter = searchParams.get("districtId")?.trim() || searchParams.get("district")?.trim() || "";
    const statusFilter = searchParams.get("status")?.trim() || "ALL";

    // Base query with strict RBAC scoping
    const whereClause: any = {};

    if (sessionRole === "STATE_LEADER") {
      whereClause.OR = [
        { state: { equals: userState || "", mode: "insensitive" } },
        { stateRef: { name: { equals: userState || "", mode: "insensitive" } } },
      ];
      whereClause.role = { in: ["ZONE_LEADER", "COORDINATOR"] };
    } else if (sessionRole === "ZONE_LEADER") {
      whereClause.role = "COORDINATOR";
      whereClause.parentZonalLeaderId = sessionUserId;
    }

    // Status filter
    if (statusFilter === "ACTIVE") {
      whereClause.isActive = true;
    } else if (statusFilter === "INACTIVE") {
      whereClause.isActive = false;
    }

    // Role filter
    if (roleFilter && roleFilter !== "ALL") {
      if (sessionRole === "ADMIN" || (sessionRole === "STATE_LEADER" && (roleFilter === "ZONE_LEADER" || roleFilter === "COORDINATOR"))) {
        whereClause.role = roleFilter;
      }
    }

    // Geographic filters
    if (stateFilter && stateFilter !== "ALL" && sessionRole === "ADMIN") {
      whereClause.OR = [
        { stateId: stateFilter },
        { state: { equals: stateFilter, mode: "insensitive" } },
      ];
    }

    if (zoneFilter && zoneFilter !== "ALL" && sessionRole !== "ZONE_LEADER") {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { zoneId: zoneFilter },
            { zone: { equals: zoneFilter, mode: "insensitive" } },
          ],
        },
      ];
    }

    if (districtFilter && districtFilter !== "ALL") {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { districtId: districtFilter },
            { district: { equals: districtFilter, mode: "insensitive" } },
            { part: { equals: districtFilter, mode: "insensitive" } },
          ],
        },
      ];
    }

    // Search query
    if (search) {
      whereClause.AND = [
        ...(whereClause.AND || []),
        {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        state: true,
        zone: true,
        district: true,
        part: true,
        stateId: true,
        zoneId: true,
        districtId: true,
        parentZonalLeaderId: true,
        stateRef: { select: { id: true, name: true, code: true } },
        zoneRef: { select: { id: true, name: true } },
        districtRef: { select: { id: true, name: true } },
        parentZonalLeader: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            subordinateCoordinators: true,
            assignedMeetings: true,
            meetingReports: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map((u) => ({
      ...u,
      displayState: u.stateRef?.name || u.state || "N/A",
      displayZone: u.zoneRef?.name || u.zone || "N/A",
      displayDistrict: u.districtRef?.name || u.district || u.part || "N/A",
      teamCount: u._count.subordinateCoordinators,
      activeMeetingsCount: u._count.assignedMeetings,
      reportsCount: u._count.meetingReports,
    }));

    return NextResponse.json(safeUsers);
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = session.user as any;
    if (sessionUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // 1. Verify username uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: validated.username, mode: "insensitive" as const } },
          ...(validated.email ? [{ email: { equals: validated.email, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or email is already in use by another account." },
        { status: 409 }
      );
    }

    // 2. Resolve State
    const state = await prisma.state.findUnique({
      where: { id: validated.stateId },
    });
    if (!state || !state.isActive) {
      return NextResponse.json({ error: "Selected State does not exist or is inactive." }, { status: 400 });
    }

    let finalZoneId: string | null = null;
    let finalZoneName: string | null = null;
    let finalDistrictId: string | null = null;
    let finalDistrictName: string | null = null;
    let finalParentZonalLeaderId: string | null = null;

    // 3. Role-specific validation and assignment
    if (validated.role === "STATE_LEADER") {
      // Check existing active State Leader
      const currentActiveLeader = await getActiveStateLeader(state.id);
      if (currentActiveLeader && !validated.replaceExistingLeader) {
        return NextResponse.json(
          {
            error: `State '${state.name}' already has an active State Leader: ${currentActiveLeader.name} (${currentActiveLeader.username}). Please confirm replacement workflow if you intend to reassign state leadership.`,
            code: "EXISTING_LEADER_CONFLICT",
            currentLeader: currentActiveLeader,
          },
          { status: 409 }
        );
      }
    } else if (validated.role === "ZONE_LEADER") {
      // Resolve or create Zone under this State
      if (validated.newZoneName) {
        const existingZone = await prisma.zone.findFirst({
          where: {
            stateId: state.id,
            name: { equals: validated.newZoneName.trim(), mode: "insensitive" },
          },
        });
        if (existingZone) {
          finalZoneId = existingZone.id;
          finalZoneName = existingZone.name;
        } else {
          const createdZone = await prisma.zone.create({
            data: {
              name: validated.newZoneName.trim(),
              stateId: state.id,
              isActive: true,
            },
          });
          finalZoneId = createdZone.id;
          finalZoneName = createdZone.name;

          await logOrganizationAction({
            action: "ZONE_CREATED",
            actorId: sessionUser.id,
            entityType: "ZONE",
            entityId: createdZone.id,
            remarks: `Zone '${createdZone.name}' created during Zonal Leader setup for State '${state.name}'`,
          });
        }
      } else if (validated.zoneId) {
        const zone = await prisma.zone.findUnique({
          where: { id: validated.zoneId },
        });
        if (!zone || !zone.isActive) {
          return NextResponse.json({ error: "Selected Zone does not exist or is inactive." }, { status: 400 });
        }
        if (zone.stateId !== state.id) {
          return NextResponse.json({ error: `Zone '${zone.name}' does not belong to State '${state.name}'.` }, { status: 400 });
        }
        finalZoneId = zone.id;
        finalZoneName = zone.name;
      } else {
        return NextResponse.json({ error: "Zone selection or new zone name is required for Zonal Leader." }, { status: 400 });
      }

      // Check existing active Zonal Leader
      if (finalZoneId) {
        const currentActiveZonalLeader = await getActiveZonalLeader(finalZoneId);
        if (currentActiveZonalLeader && !validated.replaceExistingLeader) {
          return NextResponse.json(
            {
              error: `Zone '${finalZoneName}' already has an active Zonal Leader: ${currentActiveZonalLeader.name} (${currentActiveZonalLeader.username}). Please confirm replacement workflow if you intend to reassign zonal leadership.`,
              code: "EXISTING_LEADER_CONFLICT",
              currentLeader: currentActiveZonalLeader,
            },
            { status: 409 }
          );
        }
      }
    } else if (validated.role === "COORDINATOR") {
      // Resolve Zone
      if (validated.newZoneName) {
        const existingZone = await prisma.zone.findFirst({
          where: {
            stateId: state.id,
            name: { equals: validated.newZoneName.trim(), mode: "insensitive" },
          },
        });
        if (existingZone) {
          finalZoneId = existingZone.id;
          finalZoneName = existingZone.name;
        } else {
          const createdZone = await prisma.zone.create({
            data: {
              name: validated.newZoneName.trim(),
              stateId: state.id,
              isActive: true,
            },
          });
          finalZoneId = createdZone.id;
          finalZoneName = createdZone.name;
        }
      } else if (validated.zoneId) {
        const zone = await prisma.zone.findUnique({
          where: { id: validated.zoneId },
        });
        if (!zone || !zone.isActive) {
          return NextResponse.json({ error: "Selected Zone does not exist or is inactive." }, { status: 400 });
        }
        if (zone.stateId !== state.id) {
          return NextResponse.json({ error: `Zone '${zone.name}' does not belong to State '${state.name}'.` }, { status: 400 });
        }
        finalZoneId = zone.id;
        finalZoneName = zone.name;
      } else {
        return NextResponse.json({ error: "Zone is required when creating a Coordinator." }, { status: 400 });
      }

      // Resolve District
      if (validated.newDistrictName) {
        const existingDist = await prisma.district.findFirst({
          where: {
            zoneId: finalZoneId!,
            name: { equals: validated.newDistrictName.trim(), mode: "insensitive" },
          },
        });
        if (existingDist) {
          finalDistrictId = existingDist.id;
          finalDistrictName = existingDist.name;
        } else {
          const createdDist = await prisma.district.create({
            data: {
              name: validated.newDistrictName.trim(),
              zoneId: finalZoneId!,
              isActive: true,
            },
          });
          finalDistrictId = createdDist.id;
          finalDistrictName = createdDist.name;
        }
      } else if (validated.districtId) {
        const district = await prisma.district.findUnique({
          where: { id: validated.districtId },
        });
        if (!district || !district.isActive) {
          return NextResponse.json({ error: "Selected District does not exist or is inactive." }, { status: 400 });
        }
        if (district.zoneId !== finalZoneId) {
          return NextResponse.json({ error: `District '${district.name}' does not belong to Zone '${finalZoneName}'.` }, { status: 400 });
        }
        finalDistrictId = district.id;
        finalDistrictName = district.name;
      } else {
        return NextResponse.json({ error: "District is required when creating a Coordinator." }, { status: 400 });
      }

      // Hierarchy Rule 12: Verify active Zonal Leader exists for this Zone!
      const activeZonalLeader = await getActiveZonalLeader(finalZoneId!);
      if (!activeZonalLeader) {
        return NextResponse.json(
          {
            error: `Cannot create Coordinator: No active Zonal Leader is assigned to Zone '${finalZoneName}' (${state.name}). A responsible Zonal Leader must be assigned to this Zone before adding Coordinators.`,
            code: "MISSING_ZONAL_LEADER",
          },
          { status: 422 }
        );
      }

      finalParentZonalLeaderId = activeZonalLeader.id;
    }

    // 4. Secure Password Hashing
    const passwordHash = await bcrypt.hash(validated.password, 10);
    const primaryEmail = validated.email || `${validated.username.toLowerCase()}@wcmoutreach.org`;

    // 5. Execute Creation in Atomic Database Transaction
    const createdUser = await prisma.$transaction(async (tx) => {
      // If replacing an existing leader, soft-reassign previous active leader
      if (validated.replaceExistingLeader) {
        if (validated.role === "STATE_LEADER") {
          await tx.user.updateMany({
            where: { stateId: state.id, role: "STATE_LEADER", isActive: true },
            data: { isActive: false },
          });
        } else if (validated.role === "ZONE_LEADER" && finalZoneId) {
          await tx.user.updateMany({
            where: { zoneId: finalZoneId, role: "ZONE_LEADER", isActive: true },
            data: { isActive: false },
          });
        }
      }

      // Create User record
      const newUser = await tx.user.create({
        data: {
          name: validated.name,
          username: validated.username,
          email: primaryEmail,
          emailVerified: true,
          passwordHash: passwordHash,
          phoneNumber: validated.phoneNumber || null,
          role: validated.role,
          isActive: true,
          // Normalized Foreign Keys
          stateId: state.id,
          zoneId: finalZoneId,
          districtId: finalDistrictId,
          parentZonalLeaderId: finalParentZonalLeaderId,
          // Legacy String Equivalents for 100% backward compatibility
          state: state.name,
          zone: finalZoneName,
          district: finalDistrictName,
          part: finalDistrictName || finalZoneName || state.code || "General Unit",
        },
        include: {
          stateRef: true,
          zoneRef: true,
          districtRef: true,
          parentZonalLeader: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      // Create Better Auth Account credential
      await tx.account.create({
        data: {
          accountId: primaryEmail,
          providerId: "credential",
          userId: newUser.id,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create Organization Audit Log
      await tx.organizationAuditLog.create({
        data: {
          action: `${validated.role}_CREATED`,
          actorId: sessionUser.id,
          targetUserId: newUser.id,
          entityType: "USER",
          entityId: newUser.id,
          newState: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            role: newUser.role,
            state: state.name,
            zone: finalZoneName,
            district: finalDistrictName,
            parentZonalLeaderId: finalParentZonalLeaderId,
          },
          remarks: `Admin ${sessionUser.name || sessionUser.username} created ${validated.role} '${newUser.name}' (${newUser.username}) assigned to ${state.name}${finalZoneName ? ` / ${finalZoneName}` : ""}${finalDistrictName ? ` / ${finalDistrictName}` : ""}`,
        },
      });

      return newUser;
    });

    // Remove passwordHash before returning to client
    const { passwordHash: _ph, ...safeResponse } = createdUser;

    return NextResponse.json({
      message: `${validated.role.replace("_", " ")} created successfully`,
      user: safeResponse,
    }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message, details: error.issues }, { status: 400 });
    }
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
