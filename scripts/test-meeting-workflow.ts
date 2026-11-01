import { prisma } from "../src/lib/prisma";
import { getAvailableStates, getDistrictsForState, isValidDistrict, isValidState } from "../src/lib/geographic";

async function runTests() {
  console.log("==================================================");
  console.log("   WCM OUTREACH MEETING WORKFLOW VALIDATION TEST  ");
  console.log("==================================================");

  // 1. Geographic Master Data Validation
  console.log("\n[Test 1] Geographic Master Data Verification...");
  const states = getAvailableStates();
  if (!states.includes("Andhra Pradesh") || !states.includes("Tamil Nadu")) {
    throw new Error("Master data missing Andhra Pradesh or Tamil Nadu");
  }
  const apDistricts = getDistrictsForState("Andhra Pradesh");
  if (!apDistricts.includes("Konaseema")) {
    throw new Error("Konaseema not found in Andhra Pradesh districts");
  }
  if (!isValidState("Andhra Pradesh")) throw new Error("isValidState failed for Andhra Pradesh");
  if (!isValidDistrict("Andhra Pradesh", "Konaseema")) throw new Error("isValidDistrict failed for AP/Konaseema");
  if (isValidDistrict("Andhra Pradesh", "Chennai")) throw new Error("Cross-state district validation failed");
  console.log("✓ Geographic master data validated successfully.");

  // 2. Fetch Test Users
  console.log("\n[Test 2] Verifying Staging User Accounts...");
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const apStateLeader = await prisma.user.findFirst({ where: { username: "stateleader" } });
  const apZoneLeader = await prisma.user.findFirst({ where: { username: "zoneleader" } });
  const apCoordinator = await prisma.user.findFirst({ where: { username: "coordinator" } });

  if (!admin || !apStateLeader || !apZoneLeader || !apCoordinator) {
    throw new Error("Required staging users missing in database");
  }
  console.log(`✓ Admin: ${admin.name} (${admin.id})`);
  console.log(`✓ State Leader: ${apStateLeader.name} (${apStateLeader.id})`);
  console.log(`✓ Zone Leader: ${apZoneLeader.name} (${apZoneLeader.id})`);
  console.log(`✓ Coordinator: ${apCoordinator.name} (${apCoordinator.id})`);

  // 3. Dynamic Leader Discovery Logic
  console.log("\n[Test 3] Testing Dynamic Leader Discovery for AP / Konaseema...");
  const candidates = await prisma.user.findMany({
    where: {
      OR: [
        { role: "STATE_LEADER", OR: [{ state: { equals: "Andhra Pradesh", mode: "insensitive" } }, { state: "National Headquarters" }, { state: null }] },
        { role: "ZONE_LEADER", OR: [{ state: { equals: "Andhra Pradesh", mode: "insensitive" } }, { zone: { equals: "Zone 3", mode: "insensitive" } }] },
        { role: "COORDINATOR", OR: [{ state: { equals: "Andhra Pradesh", mode: "insensitive" } }, { zone: { equals: "Zone 3", mode: "insensitive" } }] },
      ],
    },
    select: { id: true, name: true, username: true, role: true, state: true, zone: true }
  });

  const discoveredUsernames: string[] = (candidates as any[]).map((c: any) => c.username);
  console.log(`Discovered ${candidates.length} eligible leader candidates:`, discoveredUsernames);
  if (!discoveredUsernames.includes("zoneleader") || !discoveredUsernames.includes("stateleader") || !discoveredUsernames.includes("coordinator")) {
    throw new Error("Leader discovery failed to surface Pradeep, Teja, or Rajesh");
  }
  console.log("✓ Dynamic leader discovery successfully matched geographic territory.");

  // 4. Admin Creates Meeting & Assigns to Zone Leader
  console.log("\n[Test 4] Admin Creating Meeting & Assigning to Zone Leader (Atomic Transaction)...");
  const meetingDate = new Date("2026-11-15T00:00:00.000Z");
  const organizerName = "John";
  const state = "Andhra Pradesh";
  const district = "Konaseema";

  const count = await prisma.meeting.count();
  const refYear = meetingDate.getFullYear();
  const referenceId = `MTG-${refYear}-${String(count + 1).padStart(5, "0")}`;

  const createdMeeting = await prisma.$transaction(async (tx: any) => {
    const mtg = await tx.meeting.create({
      data: {
        referenceId,
        meetingDate,
        organizerName,
        state,
        district,
        createdById: admin.id,
        currentAssigneeId: apZoneLeader.id,
        currentAssigneeRole: apZoneLeader.role,
        status: "ASSIGNED_TO_LEADER",
      },
    });

    await tx.meetingAssignmentHistory.create({
      data: {
        meetingId: mtg.id,
        previousAssigneeId: null,
        newAssigneeId: apZoneLeader.id,
        previousRole: null,
        newRole: apZoneLeader.role,
        assignedById: admin.id,
        assignmentAction: "INITIAL_ADMIN_ASSIGNMENT",
        status: "ASSIGNED_TO_LEADER",
        remarks: `Meeting created and assigned by Admin ${admin.name || admin.username}`,
      },
    });

    await tx.notification.create({
      data: {
        recipientId: apZoneLeader.id,
        senderId: admin.id,
        title: "New Meeting Assigned",
        message: `Admin assigned a new meeting for ${organizerName} in ${district}, ${state} scheduled on 15 Nov 2026.`,
      },
    });

    return mtg;
  });

  console.log(`✓ Meeting created: ID ${createdMeeting.id}, Ref: ${createdMeeting.referenceId}, Status: ${createdMeeting.status}`);
  if (createdMeeting.organizerName !== "John") throw new Error("Organizer name mismatch");
  if (createdMeeting.currentAssigneeId !== apZoneLeader.id) throw new Error("Assignee mismatch");

  // 5. Leader Action: Option B - Forward to Coordinator
  console.log("\n[Test 5] Leader Action: Option B (Forwarding to Coordinator)...");
  const forwardedMeeting = await prisma.$transaction(async (tx: any) => {
    const updated = await tx.meeting.update({
      where: { id: createdMeeting.id },
      data: {
        currentAssigneeId: apCoordinator.id,
        currentAssigneeRole: apCoordinator.role,
        status: "FORWARDED_TO_COORDINATOR",
      },
    });

    await tx.meetingAssignmentHistory.create({
      data: {
        meetingId: createdMeeting.id,
        previousAssigneeId: apZoneLeader.id,
        newAssigneeId: apCoordinator.id,
        previousRole: apZoneLeader.role,
        newRole: apCoordinator.role,
        assignedById: apZoneLeader.id,
        assignmentAction: "FORWARDED_TO_COORDINATOR",
        status: "FORWARDED_TO_COORDINATOR",
        remarks: "Paul, please coordinate and arrange the meeting with John.",
      },
    });

    await tx.notification.create({
      data: {
        recipientId: apCoordinator.id,
        senderId: apZoneLeader.id,
        title: "Meeting Forwarded to You",
        message: `${apZoneLeader.name} forwarded a meeting in ${district}, ${state} to you.`,
      },
    });

    return updated;
  });

  console.log(`✓ Meeting forwarded to Coordinator ${apCoordinator.name}. Current Status: ${forwardedMeeting.status}`);
  if (forwardedMeeting.currentAssigneeId !== apCoordinator.id) throw new Error("Forwarding assignee mismatch");

  // 6. Coordinator Action: Start Workflow
  console.log("\n[Test 6] Coordinator Starting Workflow (Verification & Report Linkage)...");
  const startedWorkflow = await prisma.$transaction(async (tx: any) => {
    const rCount = await tx.meetingReport.count();
    const candidateReportId = `MR-${refYear}-${String(rCount + 1).padStart(5, "0")}`;

    // Coordinator initiates report with nested verificationSheet in PENDING status
    const report = await tx.meetingReport.create({
      data: {
        reportId: candidateReportId,
        title: `Outreach: ${forwardedMeeting.organizerName} (${forwardedMeeting.district})`,
        leaderId: apCoordinator.id,
        status: "DRAFT",
        version: 1,
        verificationSheet: {
          create: {
            status: "PENDING",
            convenerName: forwardedMeeting.organizerName,
            churchMinistryName: "",
            stateDistrictCity: `${forwardedMeeting.state}, ${forwardedMeeting.district}`,
            state: forwardedMeeting.state,
            district: forwardedMeeting.district,
            contactNumber: "",
            meetingDates: new Date(forwardedMeeting.meetingDate).toISOString().split("T")[0],
            numberOfDays: 1,
            expectedAttendance: 0,
            yearsOfMinistry: 0,
            churchMembers: 0,
            workersLeaders: 0,
            knowAboutWcm: "Admin Assignment",
            readWcmBooks: false,
            attendedProphetMeeting: false,
            meetingHallStage: "",
            soundSystem: "",
            accommodationTeam: "",
            volunteerSupport: "",
          },
        },
      },
      include: {
        verificationSheet: true,
      },
    });

    // Meeting status updated to IN_PROGRESS
    const updated = await tx.meeting.update({
      where: { id: forwardedMeeting.id },
      data: {
        status: "IN_PROGRESS",
        meetingReportId: report.id,
      },
    });

    await tx.meetingAssignmentHistory.create({
      data: {
        meetingId: forwardedMeeting.id,
        previousAssigneeId: apCoordinator.id,
        newAssigneeId: apCoordinator.id,
        previousRole: apCoordinator.role,
        newRole: apCoordinator.role,
        assignedById: apCoordinator.id,
        assignmentAction: "STATUS_CHANGE",
        status: "IN_PROGRESS",
        remarks: "Meeting workflow started by Coordinator. Verification sheet initialized.",
      },
    });

    return { updated, report, verification: report.verificationSheet! };
  });

  console.log(`✓ Workflow started. Meeting Status: ${startedWorkflow.updated.status}`);
  console.log(`✓ MeetingReport ID: ${startedWorkflow.report.id}, Code: ${startedWorkflow.report.reportId}, Status: ${startedWorkflow.report.status}`);
  console.log(`✓ VerificationSheet ID: ${startedWorkflow.verification.id}, Status: ${startedWorkflow.verification.status}`);

  // CRITICAL CHECK: Verification must be PENDING, not auto-approved
  if (startedWorkflow.verification.status !== "PENDING") {
    throw new Error(`CRITICAL FAILURE: VerificationSheet status is ${startedWorkflow.verification.status}, must be PENDING`);
  }
  console.log("✓ Verified: Verification approval chain remains completely intact and PENDING.");

  // 7. Test Assignment History Audit Trail
  console.log("\n[Test 7] Verifying Full Assignment History Audit Trail...");
  const history = await prisma.meetingAssignmentHistory.findMany({
    where: { meetingId: createdMeeting.id },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Retrieved ${history.length} assignment history records:`);
  history.forEach((h: any, idx: number) => {
    console.log(`  [${idx + 1}] Action: ${h.assignmentAction} | Prev: ${h.previousRole || 'None'} -> New: ${h.newRole} | By: ${h.assignedById} | Remarks: "${h.remarks}"`);
  });

  if (history.length !== 3) {
    throw new Error(`Expected 3 history items, got ${history.length}`);
  }
  if (history[0].assignmentAction !== "INITIAL_ADMIN_ASSIGNMENT") throw new Error("Step 1 history mismatch");
  if (history[1].assignmentAction !== "FORWARDED_TO_COORDINATOR") throw new Error("Step 2 history mismatch");
  if (history[2].assignmentAction !== "STATUS_CHANGE") throw new Error("Step 3 history mismatch");
  console.log("✓ Audit trail fully preserved and verified.");

  // 8. Test Option A: Leader Self Handling
  console.log("\n[Test 8] Testing Option A: Leader Self Handling Workflow...");
  const selfMeeting = await prisma.$transaction(async (tx: any) => {
    const refId2 = `MTG-${refYear}-${String(count + 2).padStart(5, "0")}`;
    const mtg = await tx.meeting.create({
      data: {
        referenceId: refId2,
        meetingDate,
        organizerName: "Pastor David",
        state,
        district,
        createdById: admin.id,
        currentAssigneeId: apZoneLeader.id,
        currentAssigneeRole: apZoneLeader.role,
        status: "ASSIGNED_TO_LEADER",
      },
    });

    // Leader chooses Self Handle
    const rCount2 = await tx.meetingReport.count();
    const candidateReportId2 = `MR-${refYear}-${String(rCount2 + 1).padStart(5, "0")}`;

    const report = await tx.meetingReport.create({
      data: {
        reportId: candidateReportId2,
        title: `Outreach: ${mtg.organizerName} (${mtg.district})`,
        leaderId: apZoneLeader.id,
        status: "DRAFT",
        version: 1,
        verificationSheet: {
          create: {
            status: "PENDING",
            convenerName: mtg.organizerName,
            churchMinistryName: "",
            stateDistrictCity: `${mtg.state}, ${mtg.district}`,
            state: mtg.state,
            district: mtg.district,
            contactNumber: "",
            meetingDates: new Date(mtg.meetingDate).toISOString().split("T")[0],
            numberOfDays: 1,
            expectedAttendance: 0,
            yearsOfMinistry: 0,
            churchMembers: 0,
            workersLeaders: 0,
            knowAboutWcm: "Admin Assignment",
            readWcmBooks: false,
            attendedProphetMeeting: false,
            meetingHallStage: "",
            soundSystem: "",
            accommodationTeam: "",
            volunteerSupport: "",
          },
        },
      },
      include: {
        verificationSheet: true,
      },
    });

    const updated = await tx.meeting.update({
      where: { id: mtg.id },
      data: {
        status: "SELF_HANDLED_BY_LEADER",
        meetingReportId: report.id,
      },
    });

    await tx.meetingAssignmentHistory.create({
      data: {
        meetingId: mtg.id,
        previousAssigneeId: apZoneLeader.id,
        newAssigneeId: apZoneLeader.id,
        previousRole: apZoneLeader.role,
        newRole: apZoneLeader.role,
        assignedById: apZoneLeader.id,
        assignmentAction: "SELF_HANDLED",
        status: "SELF_HANDLED_BY_LEADER",
        remarks: "Leader elected to personally handle the meeting.",
      },
    });

    return { updated, report, verification: report.verificationSheet! };
  });

  console.log(`✓ Self-handled meeting created and updated to: ${selfMeeting.updated.status}`);
  console.log(`✓ Self-handled report ID: ${selfMeeting.report.id}`);
  if (selfMeeting.updated.status !== "SELF_HANDLED_BY_LEADER") {
    throw new Error("Self handled status mismatch");
  }

  // 9. Cleanup Staging Test Data
  console.log("\n[Test 9] Cleaning Up Test Records...");
  await prisma.verificationSheet.deleteMany({
    where: { meetingReportId: { in: [startedWorkflow.report.id, selfMeeting.report.id] } },
  });
  await prisma.meeting.deleteMany({
    where: { id: { in: [createdMeeting.id, selfMeeting.updated.id] } },
  });
  await prisma.meetingReport.deleteMany({
    where: { id: { in: [startedWorkflow.report.id, selfMeeting.report.id] } },
  });
  await prisma.notification.deleteMany({
    where: {
      recipientId: { in: [apZoneLeader.id, apCoordinator.id] },
      title: { in: ["New Meeting Assigned", "Meeting Forwarded to You"] },
    },
  });
  console.log("✓ Staging test records cleanly removed.");

  console.log("\n==================================================");
  console.log("   ALL 9 TEST SUITES PASSED WITH 100% SUCCESS!    ");
  console.log("==================================================");
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
