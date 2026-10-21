# Ministry Application — Complete Security Audit & Remediation Report

**Date of Audit**: October 20, 2026  
**Auditor**: Senior Application Security Engineer & DevSecOps Auditor  
**Scope**: Full Stack (Next.js 15, Better-Auth, Prisma ORM, PostgreSQL / Supabase, Vercel Config, REST APIs)  
**Target Environment**: WCM Ministry Outreach Platform  
**Data Classification**: **HIGHLY CONFIDENTIAL**  

---

## 1. Executive Summary

A comprehensive, independent security verification and deep audit was conducted across the entire WCM Ministry Outreach Platform codebase. The audit inspected authentication mechanisms, authorization boundaries (RBAC), workflow state machines, multi-tenant data isolation, Prisma database queries, infrastructure security headers, sensitive data flows, and error handling.

All reported findings from the initial assessment were **independently inspected against actual source code**, verified, and strengthened. In addition, deep inspection identified and remediated two additional critical areas:
1. **Workflow State Machine / Finalized Report Review Bypass**: Zone and State Leaders could previously re-review, approve, or reject already finalized (`APPROVED` or `REJECTED`) reports or reports outside their active review stage.
2. **Overly Broad Vercel Origin Wildcard**: Better-Auth `trustedOrigins` previously permitted any `.vercel.app` domain. This has been strictly restricted to legitimate project-specific deployment prefixes.

All code-level fixes have been **remediated, verified, and regression-tested** with **9 / 9 automated security tests passing**. Zero application features, database relationships, UI workflows, or user permissions were broken.

---

## 2. Independent Verification of Initial Findings

| Reported Finding | Audit Verdict | Code Verification Evidence |
| :--- | :--- | :--- |
| **1. CSRF & Trusted-Origin Validation** | **VERIFIED FIXED & HARDENED** | Dynamic header reflection removed in [`src/lib/auth.ts`](file:///Users/maggi/wcm_outreach/src/lib/auth.ts). Trusted origins strictly locked to configured URLs, localhost, and verified project-prefixed Vercel preview domains. |
| **2. Profile Password-Change Verification** | **VERIFIED FIXED** | [`src/app/api/users/profile/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/users/profile/route.ts) strictly requires `currentPassword` whenever `newPassword` is supplied. Omission or mismatch returns `HTTP 400 Bad Request`. |
| **3. Password Hash Exposure in API** | **VERIFIED FIXED** | In [`src/app/api/users/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/users/route.ts), `passwordHash` is stripped prior to JSON serialization. Confirmed absent by automated response inspection. |
| **4. Cross-State, Cross-Zone Data Leakage** | **VERIFIED FIXED** | Prisma `undefined` query bypass eliminated across [`reports`](file:///Users/maggi/wcm_outreach/src/app/api/reports/route.ts), [`analytics`](file:///Users/maggi/wcm_outreach/src/app/api/analytics/monthly-summary/route.ts), [`confirmations`](file:///Users/maggi/wcm_outreach/src/app/api/confirmations/route.ts), and [`users`](file:///Users/maggi/wcm_outreach/src/app/api/users/route.ts). Missing/null scope values immediately return empty collections or 403 Forbidden. |
| **5. Required Security Headers** | **VERIFIED FIXED** | [`next.config.ts`](file:///Users/maggi/wcm_outreach/next.config.ts) injects `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security`, `X-XSS-Protection`, and `Permissions-Policy`. Confirmed via live HTTP response header inspection. |
| **6. Production Secret Handling** | **VERIFIED FIXED** | [`src/lib/auth.ts`](file:///Users/maggi/wcm_outreach/src/lib/auth.ts) implements a fatal startup check preventing production boot if `BETTER_AUTH_SECRET` is unset. |
| **7. Report ID Collision Race Condition** | **VERIFIED FIXED** | [`src/app/api/reports/create/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/reports/create/route.ts) features a unique candidate verification loop with randomized discriminators and timestamp fallback. |

---

## 3. Deep Audit: New Findings Identified & Remediated

### VULN-08: Broken Workflow State Machine in Report Review
- **Severity**: **HIGH**
- **Location**: [`src/app/api/reports/[id]/review/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/reports/[id]/review/route.ts)
- **Vulnerability**: The review endpoint permitted any leader whose zone/state matched the report author to execute review mutations (APPROVE, REQUEST_CHANGES, REJECT) at any time as long as `status !== "DRAFT"`. Consequently, a Zone Leader could reject an already `APPROVED` report or tamper with reports currently under State Leader or Admin review.
- **Remediation**:
  1. Blocked review mutations on terminal states: reports with status `APPROVED` or `REJECTED` return `HTTP 400 Bad Request`.
  2. Enforced strict stage-based authorization:
     - `ZONE_LEADER` can only review reports in `SUBMITTED` or `ZONE_LEADER_REVIEW` status for their matching zone.
     - `STATE_LEADER` can only review reports in `STATE_LEADER_REVIEW` or `STATE_AND_ADMIN_REVIEW` status for their matching state.
     - `ADMIN` can review reports in any active review stage.

### VULN-09: Overly Permissive Preview Origin Wildcard
- **Severity**: **MEDIUM**
- **Location**: [`src/lib/auth.ts`](file:///Users/maggi/wcm_outreach/src/lib/auth.ts)
- **Vulnerability**: Better-Auth trusted origins accepted any incoming origin matching `hostname.endsWith(".vercel.app")`, permitting malicious external Vercel apps to be treated as trusted origins.
- **Remediation**: Replaced generic suffix check with strict project-prefixed domain validation (`wcm-outreach*`) and explicit environment variable bindings.

### VULN-10: Null-Equality Scope Bypass Guards in Single-Resource APIs
- **Severity**: **MEDIUM**
- **Locations**: [`src/app/api/reports/[id]/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/reports/[id]/route.ts), [`src/app/api/confirmations/[id]/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/confirmations/[id]/route.ts), [`src/app/api/users/[id]/route.ts`](file:///Users/maggi/wcm_outreach/src/app/api/users/[id]/route.ts)
- **Vulnerability**: In equality checks like `report.leader.zone === session.user.zone`, if both the user's zone and the leader's zone were `null`, JavaScript evaluated `null === null` as true, unintentionally granting access.
- **Remediation**: Enforced explicit truthiness verification: `Boolean(session.user.zone && report.leader.zone === session.user.zone)`.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Endpoint | COORDINATOR | ZONE_LEADER | STATE_LEADER | ADMIN |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Create Report Draft** | `POST /api/reports/create` | Allowed | Denied | Denied | Denied |
| **Edit Report Draft** | `PUT /api/reports/[id]` | Own Drafts Only | Zone Active Only | Denied | Nationwide Active |
| **Delete Report Draft** | `DELETE /api/reports/[id]` | Own Drafts Only | Denied | Denied | Denied |
| **Submit Report** | `POST /api/reports/[id]/submit` | Own Drafts Only | Denied | Denied | Denied |
| **Review Report** | `POST /api/reports/[id]/review` | Denied | Zone Active Stage | State Active Stage | Admin Stages |
| **View Report Details** | `GET /api/reports/[id]` | Own Reports Only | Own Zone (Non-Draft) | Own State (Non-Draft) | All (Non-Draft) |
| **View Analytics** | `GET /api/analytics/*` | Denied | Zone Scope Only | State Scope Only | Nationwide Scope |
| **List Personnel** | `GET /api/users` | Denied | Zone Coordinators | State Leaders & Coords | Nationwide (All) |
| **Manage Confirmations**| `PUT /api/confirmations/[id]` | Denied | Zone Coords Only | State Coords Only | Nationwide (All) |

---

## 5. Automated Security Regression Test Results

The automated regression test suite ([`scripts/security-audit-test.ts`](file:///Users/maggi/wcm_outreach/scripts/security-audit-test.ts)) was executed against the running application:

| Test Case | Security Category | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Security Headers Enforced** | Infrastructure | `X-Frame-Options: DENY`, `nosniff`, `HSTS` | All present and valid | **PASS** |
| **Password Takeover Prevention** | Authentication | Password reset without `currentPassword` rejected | HTTP 400 Bad Request | **PASS** |
| **Vertical Privilege Escalation** | Authorization | Coordinator blocked from accessing User Directory API | HTTP 401 Unauthorized | **PASS** |
| **IDOR Draft Read Prevention** | BOLA / IDOR | Peer coordinator blocked from reading other's Draft | HTTP 403 Forbidden | **PASS** |
| **IDOR Draft Deletion Prevention** | BOLA / IDOR | Peer coordinator blocked from deleting other's Draft | HTTP 403 Forbidden | **PASS** |
| **Cross-Zone Data Isolation** | Data Scoping | Zone-2 Leader blocked from accessing Zone-1 Report | HTTP 403 Forbidden | **PASS** |
| **Sensitive Field Exclusion** | Data Exposure | `passwordHash` omitted from user creation response | Field completely absent | **PASS** |
| **Workflow State Machine** | Workflow Security | Finalized (`APPROVED`) report rejected from re-review | HTTP 400 Bad Request | **PASS** |
| **Cross-State Data Isolation** | Data Scoping | State Leader blocked from viewing other state's reports | HTTP 403 Forbidden | **PASS** |

**Summary**: **9 / 9 automated security tests passed (100% Pass Rate)**.

---

## 6. Production Security Deployment Checklist

Before deploying to Vercel production:
1. **Generate Production Secret**:
   ```bash
   openssl rand -base64 32
   ```
   Add as `BETTER_AUTH_SECRET` in Vercel environment variables.
2. **Supabase IPv4 Pooler**:
   Verify `DATABASE_URL` connects via port `5432` on `aws-0-*.pooler.supabase.com`.
3. **Canonical Domains**:
   Configure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to match your production domain.
