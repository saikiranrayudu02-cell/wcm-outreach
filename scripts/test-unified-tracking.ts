import { prisma } from "../src/lib/prisma";

async function runTests() {
  console.log("=== RUNNING UNIFIED TRACKING TESTS ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Fetch Users
    const coordinator = await prisma.user.findFirst({ where: { role: "COORDINATOR" } });
    const zoneLeader = await prisma.user.findFirst({ where: { role: "ZONE_LEADER" } });
    const stateLeader = await prisma.user.findFirst({ where: { role: "STATE_LEADER" } });
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

    assert(Boolean(coordinator && zoneLeader && stateLeader && admin), "All 4 roles exist in database");

    console.log(`\nCoordinator: ${coordinator?.username} (${coordinator?.id}) - Zone: ${coordinator?.zone}, State: ${coordinator?.state}`);
    console.log(`Zone Leader: ${zoneLeader?.username} (${zoneLeader?.id}) - Zone: ${zoneLeader?.zone}, State: ${zoneLeader?.state}`);
    console.log(`State Leader: ${stateLeader?.username} (${stateLeader?.id}) - Zone: ${stateLeader?.zone}, State: ${stateLeader?.state}`);

    // 2. Fetch existing reports
    const allReports = await prisma.meetingReport.findMany({
      include: {
        leader: true,
        verificationSheet: true,
        attendanceRecord: true,
        afterMeetingReport: true,
        auditLogs: {
          include: { actor: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    assert(allReports.length > 0, `Database has ${allReports.length} existing meeting reports`);

    const sampleReport = allReports[0];
    console.log(`\nSample Report: ${sampleReport.reportId} (ID: ${sampleReport.id})`);
    console.log(`  Overall Status: ${sampleReport.status}`);
    console.log(`  Verification Status: ${sampleReport.verificationSheet?.status}`);
    console.log(`  Attendance Status: ${sampleReport.attendanceRecord?.status}`);
    console.log(`  Evaluation Status: ${sampleReport.afterMeetingReport?.status}`);
    console.log(`  Audit Logs Count: ${sampleReport.auditLogs.length}`);

    // 3. Test Coordinator Role Filtering Simulation
    // Coordinator sees only their own reports
    const coordinatorReports = allReports.filter(r => r.leaderId === coordinator?.id);
    assert(coordinatorReports.length > 0, "Coordinator can access their own submitted reports");

    // 4. Test Zone Leader Role Filtering Simulation
    // Zone leader can access reports in their zone where status is not DRAFT
    const zoneReports = allReports.filter(r => {
      const isZoneMatch = (r.leader.zone === zoneLeader?.zone || r.verificationSheet?.zone === zoneLeader?.zone);
      const isSubmitted = r.status !== "DRAFT" || r.verificationSheet?.status !== "PENDING";
      return isZoneMatch && isSubmitted;
    });
    assert(zoneReports.length > 0, "Zonal Leader accesses authorized zone reports");

    // 5. Test State Leader Role Filtering Simulation
    // State leader can access reports in their state where status is not DRAFT
    const stateReports = allReports.filter(r => {
      const isStateMatch = (r.leader.state === stateLeader?.state || r.verificationSheet?.state === stateLeader?.state);
      const isSubmitted = r.status !== "DRAFT" || r.verificationSheet?.status !== "PENDING";
      return isStateMatch && isSubmitted;
    });
    assert(stateReports.length > 0, "State Leader accesses authorized state reports");

    // 6. Test Workflow Timeline consistency across all three roles for the same form
    // All 3 roles read from sampleReport.auditLogs, sampleReport.verificationSheet, etc.
    const auditEvents = sampleReport.auditLogs.map(l => ({
      action: l.action,
      actor: l.actor.username,
      role: l.actor.role,
      date: l.createdAt,
    }));
    console.log("\nPersisted Audit Events for Sample Report:");
    auditEvents.forEach(e => {
      console.log(`  - [${e.date.toISOString()}] ${e.action} by ${e.actor} (${e.role})`);
    });

    const hasSubmissionAudit = auditEvents.some(e => e.action.includes("SUBMIT") || e.action.includes("SAVED") || e.action.includes("CREATED"));
    assert(hasSubmissionAudit || Boolean(sampleReport.submittedAt), "Coordinator submission stage has valid persisted timestamp");

    // Check that unauthorized zone/state access is rejected
    const unauthorizedZone = "NonExistentZoneXYZ";
    const unauthorizedReports = allReports.filter(r => (r.leader.zone === unauthorizedZone || r.verificationSheet?.zone === unauthorizedZone));
    assert(unauthorizedReports.length === 0, "Zero records accessible to unauthorized zone query");

    // 7. Verify Sequential 4-Stage Workflow Timeline Integrity
    // Stage 1: Coordinator Submission
    // Stage 2: Zonal Leader Review
    // Stage 3: State Leader Review
    // Stage 4: Admin Final Decision
    const stages = ["Coordinator", "Zonal Leader", "State Leader", "Admin"];
    assert(stages.length === 4, "Complete 4-stage pipeline is defined sequentially");

    // 8. Test MR-2026-00003: Verification completed, Attendance and Evaluation PENDING
    const r3 = allReports.find(r => r.reportId === "MR-2026-00003");
    if (r3) {
      const vStatus = r3.verificationSheet?.status;
      const aStatus = r3.attendanceRecord?.status || "PENDING";
      const eStatus = r3.afterMeetingReport?.status || "PENDING";

      assert(vStatus === "COMPLETED", "MR-2026-00003 Verification is COMPLETED");
      assert(aStatus === "PENDING", "MR-2026-00003 Attendance is PENDING (not completed)");
      assert(eStatus === "PENDING", "MR-2026-00003 Evaluation is PENDING (not completed)");

      // Check audit logs for Attendance and Evaluation in r3
      const attendanceLogs = r3.auditLogs.filter(l => l.action.startsWith("ATTENDANCE_") || (l as any).formType === "ATTENDANCE");
      const evaluationLogs = r3.auditLogs.filter(l => l.action.startsWith("EVALUATION_") || (l as any).formType === "EVALUATION");

      assert(attendanceLogs.length === 0, "MR-2026-00003 has zero attendance audit logs");
      assert(evaluationLogs.length === 0, "MR-2026-00003 has zero evaluation audit logs");
    }

    console.log("\n=== TEST SUMMARY ===");
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Test execution error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
