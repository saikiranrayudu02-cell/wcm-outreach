/**
 * Automated Security Audit & Regression Test Suite
 * Tests authorization boundaries, anti-takeover protections, IDOR, and data leakage defense.
 */
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

const BASE_URL = "http://localhost:3000";

interface TestResult {
  name: string;
  category: string;
  status: "PASS" | "FAIL" | "ERROR";
  details: string;
}

const results: TestResult[] = [];

async function loginUser(username: string, password = "Password@123") {
  const res = await fetch(`${BASE_URL}/api/auth/sign-in/username`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const cookie = res.headers.get("set-cookie") || "";
  return { status: res.status, cookie };
}

async function runTests() {
  console.log("🔒 Running Automated Ministry Security Audit & Regression Tests...\n");

  // 1. Security Headers Test
  try {
    const headRes = await fetch(`${BASE_URL}/login`);
    const xFrame = headRes.headers.get("x-frame-options");
    const xContent = headRes.headers.get("x-content-type-options");
    const referrer = headRes.headers.get("referrer-policy");
    const hsts = headRes.headers.get("strict-transport-security");

    if (xFrame === "DENY" && xContent === "nosniff" && referrer && hsts) {
      results.push({
        name: "Security Headers Enforced",
        category: "Infrastructure",
        status: "PASS",
        details: `Headers present: X-Frame-Options=${xFrame}, X-Content-Type-Options=${xContent}, HSTS configured`,
      });
    } else {
      results.push({
        name: "Security Headers Enforced",
        category: "Infrastructure",
        status: "FAIL",
        details: `Missing headers. Found: X-Frame=${xFrame}, X-Content=${xContent}`,
      });
    }
  } catch (err: any) {
    results.push({ name: "Security Headers Enforced", category: "Infrastructure", status: "ERROR", details: err.message });
  }

  // 2. Authentication: Password Takeover Prevention in Profile API
  try {
    const { cookie } = await loginUser("leader_john");
    // Attempt to change password WITHOUT providing currentPassword
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ newPassword: "HackedPassword@999" }),
    });

    if (res.status === 400) {
      const data = await res.json();
      if (data.error && data.error.includes("Current password is required")) {
        results.push({
          name: "Password Change Requires Current Password",
          category: "Authentication",
          status: "PASS",
          details: `Blocked password overwrite without current password (HTTP 400: ${data.error})`,
        });
      } else {
        results.push({
          name: "Password Change Requires Current Password",
          category: "Authentication",
          status: "FAIL",
          details: `Returned 400 but unexpected message: ${JSON.stringify(data)}`,
        });
      }
    } else {
      results.push({
        name: "Password Change Requires Current Password",
        category: "Authentication",
        status: "FAIL",
        details: `Expected HTTP 400, received HTTP ${res.status}`,
      });
    }
  } catch (err: any) {
    results.push({ name: "Password Change Requires Current Password", category: "Authentication", status: "ERROR", details: err.message });
  }

  // 3. Authorization: Vertical Privilege Escalation (Coordinator calling Admin-only API)
  try {
    const { cookie } = await loginUser("leader_john");
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { cookie },
    });

    if (res.status === 401 || res.status === 403) {
      results.push({
        name: "Vertical Escalation: Coordinator cannot list users directory API",
        category: "Authorization",
        status: "PASS",
        details: `Protected: Coordinator received HTTP ${res.status} when accessing restricted user management API`,
      });
    } else {
      results.push({
        name: "Vertical Escalation: Coordinator cannot list users directory API",
        category: "Authorization",
        status: "FAIL",
        details: `Vulnerability: Coordinator accessed users API with HTTP ${res.status}`,
      });
    }
  } catch (err: any) {
    results.push({ name: "Vertical Escalation: Coordinator cannot list users directory API", category: "Authorization", status: "ERROR", details: err.message });
  }

  // 4. Authorization: IDOR Prevention on Draft Reports
  try {
    // leader_john owns draft MR-2026-0005. Find another coordinator coord_matthew.
    const johnLogin = await loginUser("leader_john");
    const matthewLogin = await loginUser("coord_matthew");

    // Fetch john's draft id
    const draft = await prisma.meetingReport.findFirst({
      where: { reportId: "MR-2026-0005" },
    });

    if (draft) {
      // Matthew attempts to GET John's draft
      const idorRes = await fetch(`${BASE_URL}/api/reports/${draft.id}`, {
        headers: { cookie: matthewLogin.cookie },
      });

      if (idorRes.status === 403) {
        results.push({
          name: "IDOR: Other Coordinator cannot view peer's Draft Report",
          category: "Authorization (BOLA/IDOR)",
          status: "PASS",
          details: `Blocked peer draft access with HTTP 403 Forbidden`,
        });
      } else {
        results.push({
          name: "IDOR: Other Coordinator cannot view peer's Draft Report",
          category: "Authorization (BOLA/IDOR)",
          status: "FAIL",
          details: `IDOR Leak: Peer accessed draft with status HTTP ${idorRes.status}`,
        });
      }

      // Matthew attempts to DELETE John's draft
      const deleteRes = await fetch(`${BASE_URL}/api/reports/${draft.id}`, {
        method: "DELETE",
        headers: { cookie: matthewLogin.cookie },
      });

      if (deleteRes.status === 403) {
        results.push({
          name: "IDOR: Other Coordinator cannot delete peer's Draft Report",
          category: "Authorization (BOLA/IDOR)",
          status: "PASS",
          details: `Blocked peer draft deletion with HTTP 403 Forbidden`,
        });
      } else {
        results.push({
          name: "IDOR: Other Coordinator cannot delete peer's Draft Report",
          category: "Authorization (BOLA/IDOR)",
          status: "FAIL",
          details: `Vulnerability: Peer attempted draft deletion with status HTTP ${deleteRes.status}`,
        });
      }
    }
  } catch (err: any) {
    results.push({ name: "IDOR Prevention on Draft Reports", category: "Authorization (BOLA/IDOR)", status: "ERROR", details: err.message });
  }

  // 5. Authorization: Cross-Zone Data Isolation (Zone 2 Leader cannot view Zone 1 Reports)
  try {
    const zone2Login = await loginUser("zone_2");
    // Zone 1 report: MR-2026-0001
    const zone1Report = await prisma.meetingReport.findFirst({
      where: { reportId: "MR-2026-0001" },
    });

    if (zone1Report) {
      const crossZoneRes = await fetch(`${BASE_URL}/api/reports/${zone1Report.id}`, {
        headers: { cookie: zone2Login.cookie },
      });

      if (crossZoneRes.status === 403) {
        results.push({
          name: "Cross-Zone Isolation: Zone 2 Leader cannot access Zone 1 report",
          category: "Data Isolation",
          status: "PASS",
          details: `Blocked cross-zone report access with HTTP 403 Forbidden`,
        });
      } else {
        results.push({
          name: "Cross-Zone Isolation: Zone 2 Leader cannot access Zone 1 report",
          category: "Data Isolation",
          status: "FAIL",
          details: `Cross-zone leakage: HTTP ${crossZoneRes.status}`,
        });
      }
    }
  } catch (err: any) {
    results.push({ name: "Cross-Zone Isolation", category: "Data Isolation", status: "ERROR", details: err.message });
  }

  // 6. Sensitive Data Exposure: Password Hash Stripped on User Creation
  try {
    const adminLogin = await loginUser("admin");
    const testUsername = `sec_test_${Date.now().toString().slice(-4)}`;
    const createRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminLogin.cookie },
      body: JSON.stringify({
        username: testUsername,
        name: "Security Test User",
        password: "Password@123",
        role: "COORDINATOR",
        state: "AP",
        zone: "Zone-1",
      }),
    });

    if (createRes.status === 200) {
      const data = await createRes.json();
      const hasPasswordHash = "passwordHash" in (data.user || {});

      // Cleanup created user immediately
      if (data.user?.id) {
        await prisma.account.deleteMany({ where: { userId: data.user.id } });
        await prisma.user.delete({ where: { id: data.user.id } });
      }

      if (!hasPasswordHash) {
        results.push({
          name: "Sensitive Data Exposure: Password hash stripped from API response",
          category: "Data Exposure",
          status: "PASS",
          details: `Verified that passwordHash field is excluded from POST /api/users response`,
        });
      } else {
        results.push({
          name: "Sensitive Data Exposure: Password hash stripped from API response",
          category: "Data Exposure",
          status: "FAIL",
          details: `Vulnerability: passwordHash was present in returned user JSON`,
        });
      }
    } else {
      results.push({
        name: "Sensitive Data Exposure: Password hash stripped from API response",
        category: "Data Exposure",
        status: "FAIL",
        details: `Failed to create test user: HTTP ${createRes.status}`,
      });
    }
  } catch (err: any) {
    results.push({ name: "Sensitive Data Exposure", category: "Data Exposure", status: "ERROR", details: err.message });
  }

  // 7. Workflow State Machine: Block Re-review on Finalized Reports
  try {
    const zone1Login = await loginUser("zone_1");
    // MR-2026-0001 is already APPROVED
    const approvedReport = await prisma.meetingReport.findFirst({
      where: { reportId: "MR-2026-0001" },
    });

    if (approvedReport) {
      const reviewRes = await fetch(`${BASE_URL}/api/reports/${approvedReport.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: zone1Login.cookie },
        body: JSON.stringify({ action: "REJECT", comment: "Attempting unauthorized state override" }),
      });

      if (reviewRes.status === 400) {
        const data = await reviewRes.json();
        results.push({
          name: "Workflow Security: Finalized reports cannot be re-reviewed or mutated",
          category: "Workflow State Machine",
          status: "PASS",
          details: `Blocked re-review of Approved report: HTTP 400 (${data.error})`,
        });
      } else {
        results.push({
          name: "Workflow Security: Finalized reports cannot be re-reviewed or mutated",
          category: "Workflow State Machine",
          status: "FAIL",
          details: `Vulnerability: Finalized report accepted review mutation with HTTP ${reviewRes.status}`,
        });
      }
    }
  } catch (err: any) {
    results.push({ name: "Workflow Security", category: "Workflow State Machine", status: "ERROR", details: err.message });
  }

  // 8. Cross-State Data Isolation: State Leader cannot access another state's records
  try {
    const stateApLogin = await loginUser("state_ap");
    // MR-2026-0006 belongs to Telangana coordinator (coord_samuel)
    const tsReport = await prisma.meetingReport.findFirst({
      where: { reportId: "MR-2026-0006" },
    });

    if (tsReport) {
      const crossStateRes = await fetch(`${BASE_URL}/api/reports/${tsReport.id}`, {
        headers: { cookie: stateApLogin.cookie },
      });

      if (crossStateRes.status === 403) {
        results.push({
          name: "Cross-State Isolation: State Leader cannot view other state's reports",
          category: "Data Isolation",
          status: "PASS",
          details: `Blocked cross-state access with HTTP 403 Forbidden`,
        });
      } else {
        results.push({
          name: "Cross-State Isolation: State Leader cannot view other state's reports",
          category: "Data Isolation",
          status: "FAIL",
          details: `Cross-state leakage: HTTP ${crossStateRes.status}`,
        });
      }
    }
  } catch (err: any) {
    results.push({ name: "Cross-State Isolation", category: "Data Isolation", status: "ERROR", details: err.message });
  }

  // Print Formatted Report
  console.log("\n==================== SECURITY REGRESSION TEST RESULTS ====================");
  let passedCount = 0;
  for (const r of results) {
    const symbol = r.status === "PASS" ? "✅" : "❌";
    console.log(`${symbol} [${r.status}] [${r.category}] ${r.name}`);
    console.log(`   └─ ${r.details}\n`);
    if (r.status === "PASS") passedCount++;
  }
  console.log(`Summary: ${passedCount}/${results.length} tests passed.`);
  console.log("=========================================================================\n");
}

runTests().finally(() => prisma.$disconnect());
