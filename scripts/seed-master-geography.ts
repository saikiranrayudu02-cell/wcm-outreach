import { prisma } from "../src/lib/prisma";
import { INDIA_STATES_DISTRICTS } from "../src/lib/geographic";

async function main() {
  console.log("==================================================");
  console.log("   SEEDING MASTER GEOGRAPHY (STATE/ZONE/DISTRICT) ");
  console.log("==================================================");

  // 1. Seed National Headquarters State for Admin
  const hqState = await prisma.state.upsert({
    where: { name: "National Headquarters" },
    update: {},
    create: {
      name: "National Headquarters",
      code: "HQ",
      isActive: true,
    },
  });

  const hqZone = await prisma.zone.upsert({
    where: {
      stateId_name: {
        stateId: hqState.id,
        name: "Central",
      },
    },
    update: {},
    create: {
      name: "Central",
      stateId: hqState.id,
      isActive: true,
    },
  });

  // 2. Seed All States from INDIA_STATES_DISTRICTS
  const stateNames = Object.keys(INDIA_STATES_DISTRICTS).sort();
  console.log(`Seeding ${stateNames.length} master states...`);

  for (const stateName of stateNames) {
    const districts = INDIA_STATES_DISTRICTS[stateName] || [];
    const state = await prisma.state.upsert({
      where: { name: stateName },
      update: {},
      create: {
        name: stateName,
        code: stateName === "Andhra Pradesh" ? "AP" : stateName.substring(0, 3).toUpperCase(),
        isActive: true,
      },
    });

    if (stateName === "Andhra Pradesh") {
      // AP has Zone 1, Zone 2, Zone 3, Zone 4
      const apZones: Record<string, string[]> = {
        "Zone 1": ["Srikakulam", "Vizianagaram", "Parvathipuram Manyam", "Visakhapatnam", "Alluri Sitharama Raju", "Anakapalli"],
        "Zone 2": ["Kakinada", "East Godavari (Rajahmundry)", "Konaseema", "West Godavari (Bhimavaram)", "Eluru"],
        "Zone 3": ["Konaseema", "Krishna", "NTR (Vijayawada)", "Guntur", "Bapatla", "Palnadu", "Prakasam (Ongole)"],
        "Zone 4": ["Nellore (SPSR Nellore)", "Tirupati", "Chittoor", "Annamayya", "YSR (Kadapa)", "Kurnool", "Nandyal", "Ananthapuramu", "Sri Sathya Sai"],
      };

      for (const [zoneName, zDistricts] of Object.entries(apZones)) {
        const zone = await prisma.zone.upsert({
          where: {
            stateId_name: {
              stateId: state.id,
              name: zoneName,
            },
          },
          update: {},
          create: {
            name: zoneName,
            stateId: state.id,
            isActive: true,
          },
        });

        for (const distName of zDistricts) {
          await prisma.district.upsert({
            where: {
              zoneId_name: {
                zoneId: zone.id,
                name: distName,
              },
            },
            update: {},
            create: {
              name: distName,
              zoneId: zone.id,
              isActive: true,
            },
          });
        }
      }
    } else {
      // For other states, create Default / Central Zone with their districts
      const defaultZone = await prisma.zone.upsert({
        where: {
          stateId_name: {
            stateId: state.id,
            name: "Zone 1",
          },
        },
        update: {},
        create: {
          name: "Zone 1",
          stateId: state.id,
          isActive: true,
        },
      });

      for (const distName of districts) {
        await prisma.district.upsert({
          where: {
            zoneId_name: {
              zoneId: defaultZone.id,
              name: distName,
            },
          },
          update: {},
          create: {
            name: distName,
            zoneId: defaultZone.id,
            isActive: true,
          },
        });
      }
    }
  }

  console.log("✓ All states, zones, and districts seeded into normalized tables.");

  // 3. Link Existing 4 Users to their Normalized Foreign Keys
  console.log("\nLinking existing users to normalized hierarchy foreign keys...");
  const apState = await prisma.state.findUnique({ where: { name: "Andhra Pradesh" } });
  if (!apState) throw new Error("AP State not found!");

  const apZone3 = await prisma.zone.findFirst({
    where: { stateId: apState.id, name: "Zone 3" },
  });
  if (!apZone3) throw new Error("AP Zone 3 not found!");

  const konaseemaDist = await prisma.district.findFirst({
    where: { zoneId: apZone3.id, name: "Konaseema" },
  });

  // Admin: Jagadeesh
  const admin = await prisma.user.findUnique({ where: { username: "admin" } });
  if (admin) {
    await (prisma as any).user.update({
      where: { id: admin.id },
      data: {
        stateId: hqState.id,
        zoneId: hqZone.id,
        state: "National Headquarters",
        zone: "Central",
        isActive: true,
      },
    });
  }

  // State Leader: Pradeep (Assigned to State)
  const pradeep = await prisma.user.findUnique({ where: { username: "stateleader" } });
  if (pradeep) {
    await (prisma as any).user.update({
      where: { id: pradeep.id },
      data: {
        stateId: apState.id,
        zoneId: null,
        districtId: null,
        parentZonalLeaderId: null,
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "AP",
        isActive: true,
      },
    });
  }

  // Zone Leader: Teja (Assigned to Zone 3)
  const teja = await prisma.user.findUnique({ where: { username: "zoneleader" } });
  if (teja) {
    await (prisma as any).user.update({
      where: { id: teja.id },
      data: {
        stateId: apState.id,
        zoneId: apZone3.id,
        districtId: null,
        parentZonalLeaderId: null,
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "Zone 3",
        isActive: true,
      },
    });
  }

  // Coordinator: Rajesh (Assigned to Zone 3, District Konaseema, Parent Zonal Leader: Teja)
  const rajesh = await prisma.user.findUnique({ where: { username: "coordinator" } });
  if (rajesh && teja) {
    await (prisma as any).user.update({
      where: { id: rajesh.id },
      data: {
        stateId: apState.id,
        zoneId: apZone3.id,
        districtId: konaseemaDist ? konaseemaDist.id : null,
        district: "Konaseema",
        parentZonalLeaderId: teja.id,
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "Zone 3",
        isActive: true,
      },
    });
  }

  // 4. Record Audit Log Entry for Hierarchy Initialization
  if (admin) {
    await (prisma as any).organizationAuditLog.create({
      data: {
        action: "ORGANIZATION_HIERARCHY_INITIALIZED",
        actorId: admin.id,
        entityType: "SYSTEM",
        remarks: "Master geographic hierarchy tables populated and existing users linked to foreign keys",
      },
    });
  }

  // 5. Verify the linked users
  const usersWithRelations = await (prisma as any).user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      isActive: true,
      stateRef: { select: { name: true } },
      zoneRef: { select: { name: true } },
      districtRef: { select: { name: true } },
      parentZonalLeader: { select: { id: true, name: true, username: true } },
    },
    orderBy: { role: "asc" },
  });

  console.log("\n==================================================");
  console.log("   USERS WITH NORMALIZED HIERARCHY RELATIONSHIPS  ");
  console.log("==================================================");
  console.dir(usersWithRelations, { depth: null });
}

main()
  .catch((e) => {
    console.error("Master geography seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
