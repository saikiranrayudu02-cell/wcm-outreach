import { prisma } from "../src/lib/prisma";

async function configureFourUsers() {
  console.log("==================================================");
  console.log("   CONFIGURING 4 USERS AND CLEANING DATABASE      ");
  console.log("==================================================");

  // 1. Identify users to keep and users to remove
  const allUsers = await prisma.user.findMany();
  const keepUsernames = ["admin", "stateleader", "zoneleader", "coordinator"];
  
  const toKeep = allUsers.filter(u => keepUsernames.includes(u.username) || u.name === "Jagadeesh");
  const toDelete = allUsers.filter(u => !keepUsernames.includes(u.username) && u.name !== "Jagadeesh");

  console.log(`Found ${toKeep.length} users to keep, ${toDelete.length} users to remove.`);
  const deleteIds = toDelete.map(u => u.id);

  if (deleteIds.length > 0) {
    console.log(`Removing dependencies for users: ${toDelete.map(u => `${u.name} (${u.username})`).join(", ")}`);
    
    // Clean up relations for toDelete users
    await prisma.verificationSheet.deleteMany({
      where: {
        meetingReport: {
          leaderId: { in: deleteIds }
        }
      }
    });

    await prisma.attendanceRecord.deleteMany({
      where: {
        meetingReport: {
          leaderId: { in: deleteIds }
        }
      }
    });

    await prisma.meetingReport.deleteMany({
      where: {
        leaderId: { in: deleteIds }
      }
    });

    await prisma.meetingAssignmentHistory.deleteMany({
      where: {
        OR: [
          { previousAssigneeId: { in: deleteIds } },
          { newAssigneeId: { in: deleteIds } },
          { assignedById: { in: deleteIds } },
        ]
      }
    });

    await prisma.meeting.deleteMany({
      where: {
        OR: [
          { currentAssigneeId: { in: deleteIds } },
          { createdById: { in: deleteIds } },
          { originalLeaderId: { in: deleteIds } },
        ]
      }
    });

    await prisma.notification.deleteMany({
      where: {
        OR: [
          { recipientId: { in: deleteIds } },
          { senderId: { in: deleteIds } },
        ]
      }
    });

    await prisma.account.deleteMany({
      where: {
        userId: { in: deleteIds }
      }
    });

    await prisma.session.deleteMany({
      where: {
        userId: { in: deleteIds }
      }
    });

    // Delete the users
    const deleteResult = await prisma.user.deleteMany({
      where: {
        id: { in: deleteIds }
      }
    });
    console.log(`✓ Deleted ${deleteResult.count} other users.`);
  }

  // 2. Configure Pradeep (State Leader, AP)
  const pradeep = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "stateleader" },
        { name: "Pradeep" }
      ]
    }
  });
  if (pradeep) {
    await prisma.user.update({
      where: { id: pradeep.id },
      data: {
        name: "Pradeep",
        role: "STATE_LEADER",
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "AP",
      }
    });
    console.log("✓ Configured Pradeep -> Role: STATE_LEADER, State: Andhra Pradesh, Zone: Zone 3");
  }

  // 3. Configure Teja (Zonal Leader, AP, Zone 3)
  const teja = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "zoneleader" },
        { name: "Teja" }
      ]
    }
  });
  if (teja) {
    await prisma.user.update({
      where: { id: teja.id },
      data: {
        name: "Teja",
        role: "ZONE_LEADER",
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "Zone 3",
      }
    });
    console.log("✓ Configured Teja -> Role: ZONE_LEADER, State: Andhra Pradesh, Zone: Zone 3");
  }

  // 4. Configure Rajesh (Coordinator, AP, Zone 3)
  const rajesh = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "coordinator" },
        { name: "Rajesh" }
      ]
    }
  });
  if (rajesh) {
    await prisma.user.update({
      where: { id: rajesh.id },
      data: {
        name: "Rajesh",
        role: "COORDINATOR",
        state: "Andhra Pradesh",
        zone: "Zone 3",
        part: "Zone 3",
      }
    });
    console.log("✓ Configured Rajesh -> Role: COORDINATOR, State: Andhra Pradesh, Zone: Zone 3");
  }

  // 5. Verify Jagadeesh (Admin)
  const jagadeesh = await prisma.user.findFirst({
    where: {
      OR: [
        { username: "admin" },
        { role: "ADMIN" }
      ]
    }
  });
  console.log(`✓ Admin verified intact: ${jagadeesh?.name} (${jagadeesh?.username}) - Role: ${jagadeesh?.role}`);

  // 6. Verify total remaining users
  const finalUsers = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      state: true,
      zone: true,
      part: true,
    },
    orderBy: {
      role: "asc"
    }
  });

  console.log("\n==================================================");
  console.log(`   FINAL USERS IN DATABASE (Total: ${finalUsers.length})         `);
  console.log("==================================================");
  console.table(finalUsers);

  if (finalUsers.length !== 4) {
    throw new Error(`Expected exactly 4 users in database, but found ${finalUsers.length}!`);
  }
}

configureFourUsers()
  .catch((e) => {
    console.error("Configuration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
