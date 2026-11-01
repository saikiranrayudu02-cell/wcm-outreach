import { prisma } from "@/lib/prisma";

export interface HierarchyScopeCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Validates that:
 * 1. State exists and is active.
 * 2. If zoneId provided, Zone exists, is active, and belongs to stateId.
 * 3. If districtId provided, District exists, is active, and belongs to zoneId.
 */
export async function validateHierarchyScope(
  stateId: string,
  zoneId?: string | null,
  districtId?: string | null
): Promise<{ valid: boolean; error?: string; state?: any; zone?: any; district?: any }> {
  const state = await prisma.state.findUnique({
    where: { id: stateId },
  });
  if (!state || !state.isActive) {
    return { valid: false, error: "Selected state does not exist or is inactive" };
  }

  let zone: any = null;
  if (zoneId) {
    zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });
    if (!zone || !zone.isActive) {
      return { valid: false, error: "Selected zone does not exist or is inactive" };
    }
    if (zone.stateId !== stateId) {
      return { valid: false, error: `Zone '${zone.name}' does not belong to state '${state.name}'` };
    }
  }

  let district: any = null;
  if (districtId) {
    district = await prisma.district.findUnique({
      where: { id: districtId },
    });
    if (!district || !district.isActive) {
      return { valid: false, error: "Selected district does not exist or is inactive" };
    }
    if (!zoneId || district.zoneId !== zoneId) {
      return { valid: false, error: `District '${district.name}' does not belong to the selected zone` };
    }
  }

  return { valid: true, state, zone, district };
}

/**
 * Finds the currently active Zonal Leader for a specific Zone.
 */
export async function getActiveZonalLeader(zoneId: string) {
  return await prisma.user.findFirst({
    where: {
      role: "ZONE_LEADER",
      zoneId: zoneId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phoneNumber: true,
      role: true,
      state: true,
      zone: true,
      isActive: true,
    },
  });
}

/**
 * Finds the currently active State Leader for a specific State.
 */
export async function getActiveStateLeader(stateId: string) {
  return await prisma.user.findFirst({
    where: {
      role: "STATE_LEADER",
      stateId: stateId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phoneNumber: true,
      role: true,
      state: true,
      isActive: true,
    },
  });
}

/**
 * Creates an immutable Organization Audit Log record.
 */
export async function logOrganizationAction(params: {
  action: string;
  actorId: string;
  targetUserId?: string | null;
  entityType?: "USER" | "STATE" | "ZONE" | "DISTRICT" | "SYSTEM";
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  remarks?: string | null;
}) {
  try {
    return await prisma.organizationAuditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId,
        targetUserId: params.targetUserId || null,
        entityType: params.entityType || "USER",
        entityId: params.entityId || null,
        previousState: params.previousState ? params.previousState : undefined,
        newState: params.newState ? params.newState : undefined,
        remarks: params.remarks || null,
      },
    });
  } catch (err) {
    console.error("Failed to create organization audit log:", err);
  }
}
