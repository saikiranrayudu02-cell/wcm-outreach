# WCM Outreach — Ministry Reporting System
## Comprehensive System Architecture, Implementation & Operations Manual

---

**Project Name**: WCM Ministry Coordinator Reporting System ("WCM Outreach")  
**Organization**: World Christian Ministry (WCM)  
**Document Version**: 2.0.0  
**Preparation Date**: October 17, 2026  
**Document Classification**: Ministry Technical & Operational Documentation  
**Repository**: `saikiranrayudu02-cell/wcm-outreach`  

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Project Objectives and Scope](#2-project-objectives-and-scope)
3. [Complete Feature Documentation](#3-complete-feature-documentation)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Complete Project Folder Structure](#6-complete-project-folder-structure)
7. [User Interface Documentation](#7-user-interface-documentation)
8. [Database Documentation](#8-database-documentation)
9. [API Documentation](#9-api-documentation)
10. [Authentication and Security](#10-authentication-and-security)
11. [Installation and Local Setup](#11-installation-and-local-setup)
12. [Environment Configuration](#12-environment-configuration)
13. [Testing and Quality Assurance](#13-testing-and-quality-assurance)
14. [Deployment Documentation](#14-deployment-documentation)
15. [Troubleshooting Guide](#15-troubleshooting-guide)
16. [Limitations and Future Improvements](#16-limitations-and-future-improvements)
17. [User Guide](#17-user-guide)
18. [Developer Maintenance Guide](#18-developer-maintenance-guide)
19. [Glossary and References](#19-glossary-and-references)

---

## 1. Executive Summary

### 1.1 Project Purpose
The **WCM Ministry Coordinator Reporting System** (internally designated **WCM Outreach**) is an enterprise-grade ministry operations platform built for **World Christian Ministry (WCM)**. It provides a structured, verifiable, and hierarchical pipeline for reporting, reviewing, and auditing outreach meetings conducted across diverse geographical jurisdictions (States, Zones, and Districts).

### 1.2 Problems It Solves
Prior to the implementation of WCM Outreach, ministry data collection suffered from several critical operational challenges:
* **Fragmented Communication**: Meeting outcomes, attendance counts, and church host arrangements were communicated through unstandardized channels (messaging apps, phone calls, paper slips).
* **Delayed Decision-Making**: Leadership lacked real-time visibility into whether meetings were properly arranged, how many pastors and members attended, and what follow-up opportunities were created.
* **Lack of Accountability and Audit Trails**: Review comments and report modifications could not be tracked back to specific leaders.
* **Connectivity Barriers**: Coordinators often travel to remote rural territories with intermittent mobile connectivity, requiring offline fallback capabilities and mobile-first touch optimization.

### 1.3 Intended Users
The system serves four primary ministry roles:
1. **Outreach Coordinators**: Field executives on the ground who coordinate with local pastors, verify venue arrangements, record attendee statistics, and submit detailed post-meeting evaluations.
2. **Zone Leaders**: Regional overseers responsible for all coordinators and meetings within an assigned Zone (e.g., Zone-1). They edit, approve, or forward reports up the hierarchy.
3. **State Leaders**: Overseers of an entire state ministry territory (e.g., Andhra Pradesh), reviewing aggregate statistics and approving outreach activities.
4. **System Administrators**: Central ministry leadership possessing unrestricted authority over user provisioning, hierarchical delegations, global report approvals, system announcements, and ministry analytics.

---

## 2. Project Objectives and Scope

### 2.1 Primary Objectives
1. **Unified Report Lifecycle**: Consolidate Verification (pre-meeting), Attendance (meeting execution), and After-Meeting (post-meeting impact) into a single atomic report record with unique serial identification (e.g., `MR-2026-00015`).
2. **Hierarchical Multi-Tier Review**: Support report forwarding, review comments, status workflows (`DRAFT` $\to$ `SUBMITTED` $\to$ `ZONE_LEADER_REVIEW` $\to$ `STATE_LEADER_REVIEW` $\to$ `ADMIN_REVIEW` $\to$ `APPROVED` / `REJECTED` / `REQUEST_CHANGES`).
3. **Personnel Directory & Directory Search**: Enable leaders to search coordinators and candidates by name, phone number, and jurisdiction with profile image inspection.
4. **Meeting Confirmation Workflow**: Allow coordinators to propose upcoming meeting venues and dates to administration prior to field deployment.
5. **Progressive Web Application (PWA)**: Ensure offline screen fallback, service-worker asset caching, installable home-screen experience, and mobile responsive execution without layout-induced zoom.

### 2.2 System Scope
* **In-Scope**:
  * Role-based access control (RBAC) enforced via Next.js Middleware and API route handlers.
  * Multi-language interface support (English, Hindi, Telugu).
  * Dark/Light aesthetic design system with smooth CSS theme switching.
  * 4-second branded animated splash screen on application startup.
  * Aggregated statistical analytics (Location coverage pie charts, monthly trend bar charts).
  * Profile customization, password modification, and image upload.
* **Out-of-Scope**:
  * Direct financial or monetary donation processing.
  * Direct SMS gateway broadcasting (internal notifications and announcement system is implemented instead).

---

## 3. Complete Feature Documentation

### 3.1 Branded 4-Second Splash Screen
* **File Reference**: `src/components/splash-screen.tsx`, `src/app/globals.css`
* **Behavior**: Upon initial application load or browser refresh, a full-screen branded splash screen displays the official WCM logo (`/icons/icon-512x512.png`), concentric pulsing rings (`splash-ring`), an animated progress bar, and ministry title. It plays for exactly 4.0 seconds, smoothly fading out at 3.4 seconds to reveal the underlying view.
* **Responsiveness**: Wrapped in `overflow-hidden` to prevent layout expansion on compact mobile viewports.

### 3.2 Secure Multi-Role Authentication
* **File Reference**: `src/lib/auth.ts`, `src/app/login/page.tsx`, `src/middleware.ts`
* **Behavior**: Authentication is managed by Better Auth with a custom PostgreSQL Prisma adapter. Users authenticate using their unique `username` and `password`. Passwords are verified against salted bcrypt hashes.
* **Demo Switcher**: Includes preconfigured 1-click test credentials on `/login` for rapid testing of Admin, Coordinator, State Leader, and Zone Leader roles.

### 3.3 Three-Part Meeting Report Engine
A meeting report is composed of three interconnected sub-sheets:
1. **Verification Sheet (`VerificationSheet`)**: Recorded before the meeting. Captures Host Convener name, church ministry, location, phone number, meeting dates, days, expected attendance, years of ministry, stage/sound/accommodation readiness, and awareness of WCM literature.
2. **Attendance Record (`AttendanceRecord`)**: Recorded during/immediately after the meeting. Captures date, location, field executer name, coordinator name, total member count, total visiting pastors count, and field remarks.
3. **After-Meeting Report (`AfterMeetingReport`)**: Recorded post-meeting. Captures overall outcome, congregation response, desire for ongoing fellowship, observed strengths, challenges, new follower count, coordinator signature, and future event opportunities.

### 3.4 Meeting Proposal & Confirmation System
* **File Reference**: `src/app/coordinator/confirmations/page.tsx`, `src/app/api/confirmations/route.ts`
* **Behavior**: Coordinators submit proposed dates, venue details, and estimated attendees before conducting an outreach. Administrators review the proposal and either approve it or provide written feedback.

### 3.5 Hierarchical Directory ("Find People")
* **File Reference**: `src/app/find-people/page.tsx`, `src/app/api/users/route.ts`
* **Behavior**: Allows authorized leaders to search personnel by candidate name or contact number. Scoped to the leader's jurisdiction (Admins search globally; State Leaders search their State; Zone Leaders search their Zone).
* **Modal Viewer**: Displays candidate history, phone call action (`tel:`), email action (`mailto:`), and high-resolution photo viewer with direct image download.

### 3.6 Internal Messaging & Announcement Center
* **File Reference**: `src/app/api/notifications/route.ts`, `src/components/dashboard-layout.tsx`
* **Behavior**: Administrative and Zone leaders can dispatch broadcast announcements or individual direct messages to coordinators. Unread counts are displayed with animated pulsing badges in the top navbar and mobile bottom sheet.

### 3.7 Statistical Analytics & KPI Dashboard
* **File Reference**: `src/app/api/analytics/monthly-summary/route.ts`, `src/components/monthly-summary.tsx`
* **Behavior**: Aggregates verified reports for any selected Month and Year. Displays total meetings conducted, total members attended, total WCM followers, a circular SVG location distribution pie chart, and a 12-month trend bar chart.

### 3.8 PWA & Offline Support
* **File Reference**: `public/sw.js`, `public/manifest.json`, `public/offline.html`, `src/components/pwa-provider.tsx`
* **Behavior**: Registers a service worker caching essential app icons and static bundles. When network connectivity drops, navigation requests gracefully fall back to `offline.html` styled with the WCM theme.

---

## 4. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js App Router | 15.1.12 | Core full-stack web framework & hybrid SSR/SSG |
| **Runtime** | Node.js | v20+ / v22 | Server execution environment |
| **Language** | TypeScript | 5.x | Strict static type checking |
| **UI Library** | React | 19.0.0 | Component rendering engine |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS engine with `@theme` tokens |
| **Icons** | Lucide React | 1.24.0 | Modern SVG interface iconography |
| **State Management** | Zustand | 5.0.14 | Global client UI store (sidebar, language, theme) |
| **Theme Engine** | Next-Themes | 0.4.6 | Dark and light mode class management |
| **Form Handling** | React Hook Form | 7.81.0 | High-performance uncontrolled form validation |
| **Database ORM** | Prisma | 5.22.0 | PostgreSQL database schema modeling and client queries |
| **Database** | PostgreSQL / Supabase | 15+ | Relational persistence with transaction pooling |
| **Authentication** | Better Auth | 1.6.23 | Cookie session management & credential verification |
| **Password Hashing** | Bcrypt | 6.0.0 | Cryptographic password hashing (10 salt rounds) |
| **Toast Alerts** | Sonner | 2.0.7 | Accessible rich notification toasts |

---

## 5. System Architecture

### 5.1 Architecture Overview
The application follows a modern **Modular Serverless Monolith** architecture built on the Next.js App Router. Client components interact with server-side API Route Handlers using standard HTTP JSON payloads. Session validation is executed at the Edge/Node boundary via `middleware.ts`.

```
+--------------------------------------------------------------------------------+
|                                CLIENT DEVICES                                  |
|   Mobile (iOS / Android)  |  Tablet (iPad / Galaxy)  |  Desktop (Chrome / Mac) |
+--------------------------------------------------------------------------------+
                                       |
                                       | HTTPS Requests / Cookies
                                       v
+--------------------------------------------------------------------------------+
|                         NEXT.JS APP ROUTER GATEWAY                             |
|  - Middleware Authorization Check (`src/middleware.ts`)                       |
|  - Service Worker Cache Interception (`public/sw.js`)                          |
+--------------------------------------------------------------------------------+
          |                                                    |
          | Page Routes                                        | API Route Handlers
          v                                                    v
+-----------------------------+               +----------------------------------+
|      REACT 19 UI VIEWS      |               |      NEXT.JS API CONTROLLERS     |
| - Login & Splash Screen     |  JSON Fetch   | - `/api/auth/[...auth]`          |
| - Coordinator Workspace     | ------------> | - `/api/reports/*`               |
| - Zone & State Dashboards   |               | - `/api/users/*`                 |
| - Admin Control Console     | <------------ | - `/api/confirmations/*`         |
| - Find People & Profile     |  JSON State   | - `/api/analytics/*`             |
+-----------------------------+               +----------------------------------+
                                                               |
                                                               v
                                              +----------------------------------+
                                              |        PRISMA ORM ENGINE         |
                                              |  Type-safe Queries & Relations   |
                                              +----------------------------------+
                                                               |
                                                               v
                                              +----------------------------------+
                                              |       POSTGRESQL DATABASE        |
                                              |   Supabase IPv4 Pooler (:5432)   |
                                              +----------------------------------+
```

### 5.2 Report Status State Machine

```
   [DRAFT] (Coordinator edits freely)
      |
      v
  (Submit)
      |
      v
  [SUBMITTED]
      |
      +---> [ZONE_LEADER_REVIEW] ---> (Review / Approve) ---> [STATE_LEADER_REVIEW]
      |                                                             |
      |                                                             v
      +------------------------ (Forward) -------------------> [ADMIN_REVIEW]
                                                                    |
                                                     +--------------+--------------+
                                                     |                             |
                                                     v                             v
                                                [APPROVED]                  [REQUEST_CHANGES]
                                            (Finalized Archive)         (Returned to Coordinator)
```

---

## 6. Complete Project Folder Structure

```
wcm_outreach/
├── docs/                                    # Project Technical Documentation
│   ├── Ministry_Project_Complete_Documentation.md
│   └── Ministry_Project_Complete_Documentation.pdf
├── prisma/                                  # Database ORM Configuration
│   ├── schema.prisma                        # Prisma data models & relational schema
│   └── seed.ts                              # Database seeder with demo accounts
├── public/                                  # Static Public Assets
│   ├── icons/                               # PWA app icons (72px to 512px)
│   ├── manifest.json                        # PWA web app manifest
│   ├── offline.html                         # Offline fallback HTML page
│   ├── sw.js                                # Custom Service Worker caching script
│   └── wcm-logo.png                         # High-resolution ministry brand logo
├── src/
│   ├── app/                                 # Next.js App Router (Pages & APIs)
│   │   ├── admin/dashboard/page.tsx         # Admin control panel (Users & Reports)
│   │   ├── api/                             # Backend REST API Routes
│   │   │   ├── analytics/monthly-summary/   # Analytics aggregation endpoint
│   │   │   ├── auth/[...auth]/              # Better-Auth catch-all handler
│   │   │   ├── confirmations/               # Meeting proposal endpoints
│   │   │   ├── notifications/               # Internal messaging endpoints
│   │   │   ├── reports/                     # Report creation, submission, review
│   │   │   └── users/                       # User management & profile endpoints
│   │   ├── coordinator/                     # Coordinator Workspace
│   │   │   ├── confirmations/page.tsx       # Meeting confirmation requests
│   │   │   ├── dashboard/page.tsx           # Coordinator central dashboard
│   │   │   └── report/[id]/page.tsx         # Unified 3-step report editor wizard
│   │   ├── find-people/page.tsx             # Directory search & personnel details
│   │   ├── globals.css                      # Master CSS design system & tokens
│   │   ├── layout.tsx                       # Root layout with providers & splash screen
│   │   ├── login/page.tsx                   # Authentication page with demo selector
│   │   ├── profile/page.tsx                 # Profile details & password manager
│   │   ├── state-leader/dashboard/page.tsx  # State Leader overview console
│   │   └── zone-leader/dashboard/page.tsx   # Zone Leader review console
│   ├── components/                          # Reusable React Components
│   │   ├── auth-sync-provider.tsx           # Syncs Better-Auth session with Zustand store
│   │   ├── dashboard-layout.tsx             # Responsive sidebar, navbar & mobile bottom bar
│   │   ├── monthly-summary.tsx              # Analytics charts & KPI counters
│   │   ├── pwa-provider.tsx                 # PWA service worker registration & install prompts
│   │   ├── splash-screen.tsx                # 4-second animated brand startup screen
│   │   └── theme-provider.tsx               # Next-Themes dark/light provider
│   ├── lib/                                 # Core Utilities & Singletons
│   │   ├── auth-client.ts                   # Better-Auth client instance
│   │   ├── auth.ts                          # Better-Auth server configuration
│   │   ├── prisma.ts                        # Global Prisma client singleton
│   │   └── translations.ts                  # Localization dictionary (EN, HI, TE)
│   ├── middleware.ts                        # Route protection & role redirection middleware
│   └── store/
│       └── ui-store.ts                      # Zustand state store for navigation & theme
├── .env.example                             # Safe environment variable template
├── package.json                             # Project dependencies and build scripts
└── tsconfig.json                            # TypeScript compiler settings
```

---

## 7. User Interface Documentation

### 7.1 Authentication (`/login`)
* **Design Language**: Full-bleed indigo-violet gradient background, floating logo with soft radial blur, glassmorphic card container.
* **Form Controls**: Mobile-friendly 16px inputs (`text-base sm:text-sm`) to eliminate iOS Safari auto-zoom. Toggleable password visibility eye icon.
* **Demo Selector**: Quick 1-click credential buttons for Admin, Coordinator, State Leader, and Zone Leader.

### 7.2 Main Dashboard Frame (`src/components/dashboard-layout.tsx`)
* **Desktop Navigation**: Fixed left-hand gradient sidebar (`w-65`) with brand logo, role indicator, navigation links, and profile badge.
* **Mobile Navigation**: Hidden sidebar on small screens; replaced with an ergonomic fixed bottom navigation bar (`fixed bottom-0 left-0 right-0 z-30`) with safe-area inset padding (`pb-safe`).
* **Top App Bar**: Sticky glassmorphic navbar with theme toggle (Sun/Moon), language selector (EN, HI, TE), notification bell with unread ping indicator, and user avatar.

### 7.3 Coordinator Workspace (`/coordinator/dashboard`)
* **Welcome Banner**: Gradient card displaying greeting and ministry overview.
* **Action Modules**: "Create New Report" button and "Meeting Confirmations" quick link.
* **Announcements Feed**: Live broadcast messages sent by administrators.
* **Reports List**: Dual-mode rendering: responsive card list on phones (`md:hidden`) and sortable table on tablets/desktops (`hidden md:block overflow-x-auto`).

### 7.4 Report Wizard (`/coordinator/report/[id]`)
* **Stepped Navigation**: 3-step navigation tab bar (1. Verification, 2. Attendance, 3. After Meeting) with individual completion percentages.
* **Auto-Save & Submit**: "Save Draft" updates the database in real-time. "Submit Report" is enabled only when all mandatory fields pass validation.
* **Review Feedback Alert**: Displays reviewer notes if a report was returned with status `REQUEST_CHANGES`.

### 7.5 Directory ("Find People") (`/find-people`)
* **Live Search**: Debounced search input filtering across name, username, and telephone.
* **Role Filter**: Dropdown allowing filtering by role (scoped to leader authority).
* **Modal Viewer**: Candidate details modal with phone call and email triggers, jurisdiction badges, and profile image viewer.

---

## 8. Database Documentation

The database schema is defined in `prisma/schema.prisma` and backed by PostgreSQL.

### 8.1 Model: `User` (`users`)
Stores all ministry personnel credentials, jurisdiction, and profile details.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Unique primary key |
| `username` | `String` | `@unique` | Login username |
| `passwordHash`| `String` | `@map("password_hash")`| Bcrypt hashed password |
| `role` | `Role` | Enum | `ADMIN`, `COORDINATOR`, `STATE_LEADER`, `ZONE_LEADER` |
| `name` | `String` | | Full legal or ministry name |
| `email` | `String` | `@unique` | Contact email address |
| `emailVerified`| `Boolean`| | Email verification flag |
| `phoneNumber`| `String?` | | Mobile contact number |
| `image` | `String?` | | Base64 or URL profile picture |
| `state` | `String?` | | Assigned state jurisdiction (e.g., "AP") |
| `zone` | `String?` | | Assigned zone jurisdiction (e.g., "Zone-1") |
| `part` | `String?` | | Assigned territory part (e.g., "Part-1") |
| `createdAt` | `DateTime` | `@default(now())` | Registration timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

### 8.2 Model: `MeetingReport` (`meeting_reports`)
The parent record for every outreach meeting report.

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id @default(uuid())` | Primary key |
| `reportId` | `String` | `@unique` | Human-readable ID (e.g. `MR-2026-00015`) |
| `leaderId` | `String` | Foreign key $\to$ `User.id` | Coordinator who filed the report |
| `status` | `ReportStatus` | `@default(DRAFT)` | Workflow status |
| `version` | `Int` | `@default(1)` | Report version counter |
| `submittedAt`| `DateTime?`| | Date of submission |
| `createdAt` | `DateTime` | `@default(now())` | Creation date |
| `updatedAt` | `DateTime` | `@updatedAt` | Last updated date |

### 8.3 Model: `VerificationSheet` (`verification_sheets`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `convenerName` | `String` | Name of host pastor or meeting convener |
| `churchMinistryName` | `String` | Host church ministry name |
| `stateDistrictCity` | `String` | Location description |
| `contactNumber` | `String` | Contact phone number |
| `meetingDates` | `String` | Scheduled meeting dates |
| `numberOfDays` | `Int` | Duration of outreach in days |
| `expectedAttendance`| `Int` | Anticipated crowd size |
| `yearsOfMinistry` | `Int` | Host pastor's ministry experience |
| `churchMembers` | `Int` | Registered church congregation size |
| `workersLeaders` | `Int` | Assisting volunteers count |
| `knowAboutWcm` | `String` | Discovery source for WCM ministry |
| `readWcmBooks` | `Boolean` | Familiarity with Prophet Kiran's literature |
| `attendedProphetMeeting`| `Boolean`| Prior attendance at WCM events |
| `meetingHallStage` | `String` | Stage and venue preparation readiness |
| `soundSystem` | `String` | Audio system readiness |
| `accommodationTeam` | `String` | Lodging arrangements for ministry team |
| `volunteerSupport` | `String` | Local volunteer readiness |

### 8.4 Model: `AttendanceRecord` (`attendance_records`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `date` | `DateTime` | Meeting execution date |
| `location` | `String` | Exact venue address / church |
| `fieldExecuter` | `String` | Name of field executer |
| `coordinator` | `String` | Coordinator in charge |
| `membersAttended`| `Int` | Count of regular congregation members |
| `pastorsAttended`| `Int` | Count of visiting ministers / pastors |
| `remarks` | `String` | Coordinator observations & notes |

### 8.5 Model: `AfterMeetingReport` (`after_meeting_reports`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `overallMeetingOutcome`| `String` | Evaluation of meeting impact |
| `congregationResponse` | `String` | Audience receptivity |
| `continueFellowship` | `Boolean` | Desire for continued WCM association |
| `futureOpportunities` | `String[]` | Array of future event opportunities |
| `localChurchInfluence` | `String` | Influence assessment of local church |
| `networkOfPastors` | `String` | Ministerial network strength |
| `strengthsObserved` | `String` | Key highlights and positive outcomes |
| `challengesObserved` | `String` | Impediments or difficulties faced |
| `opportunityForWcm` | `String` | Future partnership potential for WCM |
| `coordinatorName` | `String` | Signer name |
| `designation` | `String` | Ministry designation |
| `signature` | `String` | Textual signature |
| `submissionDate` | `DateTime` | Date of sign-off |
| `followingWcmMembersCount`| `Int` | New members connecting with WCM |

---

## 9. API Documentation

All API endpoints are hosted under `/api/` and require valid session authentication unless explicitly public.

### 9.1 Authentication Endpoints
* **`POST /api/auth/[...auth]`**: Managed by Better Auth. Handles `signIn.email`, `signIn.username`, `signOut`, `getSession`.
  * **Headers**: `Content-Type: application/json`
  * **Cookies Issued**: `better-auth.session_token` (HTTP-only, Secure in production).

### 9.2 User Management Endpoints
* **`GET /api/users`**: List personnel. Supports search and role query parameters (`?search=john&role=COORDINATOR`).
* **`POST /api/users`**: Create a new coordinator or leader (Admin only).
  * **Payload**: `{ username, name, email, password, role, state?, zone?, part?, phoneNumber? }`
* **`GET /api/users/[id]`**: Fetch specific user profile details.
* **`PUT /api/users/[id]`**: Update role, jurisdiction, or reset password.
* **`DELETE /api/users/[id]`**: Delete a user (Cascades sessions, notifications, and reports).
* **`GET /api/users/profile`**: Get current logged-in user profile, stats, and recent reports.
* **`PUT /api/users/profile`**: Update personal name, email, phone, avatar image, or password.

### 9.3 Meeting Report Endpoints
* **`GET /api/reports`**: Returns reports scoped to caller's role (Coordinators see their own; Zone/State Leaders see their jurisdiction; Admins see all).
* **`POST /api/reports/create`**: Generates a new empty draft report with unique auto-incrementing ID.
* **`GET /api/reports/[id]`**: Fetch complete report including verification, attendance, and after-meeting sub-sheets.
* **`PUT /api/reports/[id]`**: Save updates to verification, attendance, or after-meeting sheets.
* **`DELETE /api/reports/[id]`**: Delete a draft report (Only allowed for `DRAFT` status).
* **`POST /api/reports/[id]/submit`**: Validate completeness and advance report status from `DRAFT` $\to$ `SUBMITTED`.
* **`POST /api/reports/[id]/review`**: Review action (`APPROVE`, `REQUEST_CHANGES`, `REJECT`) with required comment.
* **`POST /api/reports/[id]/forward`**: Forward report to `STATE_LEADER`, `ADMIN`, or `BOTH`.

### 9.4 Meeting Confirmations & Notifications
* **`GET /api/confirmations`**: Fetch proposal requests.
* **`POST /api/confirmations`**: Submit meeting proposal (`meetingDates`, `location`, `expectedAttendance`, `message`).
* **`PUT /api/confirmations/[id]`**: Admin decision endpoint (`status: "APPROVED" | "REJECTED"`, `adminFeedback`).
* **`GET /api/notifications`**: Get list of notifications received by user.
* **`POST /api/notifications`**: Send an announcement or direct message (`recipientId`, `title`, `message`).
* **`PUT /api/notifications/[id]/read`**: Mark specific message as read.

### 9.5 Analytics
* **`GET /api/analytics/monthly-summary?month=10&year=2026`**:
  * **Response**:
    ```json
    {
      "summary": {
        "totalMeetings": 12,
        "totalMembersAttended": 1450,
        "totalWcmFollowers": 380
      },
      "pieChartData": [
        { "name": "Vijayawada", "count": 6, "percentage": 50 },
        { "name": "Guntur", "count": 6, "percentage": 50 }
      ],
      "barChartData": [
        { "month": "Jan", "meetings": 2, "attendees": 240 },
        ...
      ]
    }
    ```

---

## 10. Authentication and Security

### 10.1 Authentication Flow
1. **Credentials**: Client submits `username` and `password` to `/api/auth/sign-in/username`.
2. **Password Verification**: Better Auth queries `User` table; Bcrypt verifies password hash.
3. **Session Cookie**: Server generates cryptographically random token saved in `Session` table and sets `better-auth.session_token` HTTP-only cookie.
4. **Middleware Interception**: Every protected request is intercepted by `src/middleware.ts` before reaching any route handler or page component.
5. **RBAC Routing**: Non-privileged users attempting to access routes outside their role are redirected to their assigned dashboard.

### 10.2 Security Safeguards
* **Encrypted Passwords**: Passwords hashed with Bcrypt (10 salt rounds). Plaintext passwords are never stored.
* **HTTP-Only Cookies**: Prevents client-side XSS access to active authentication session tokens.
* **Cascading Foreign Key Integrity**: Deleting a user safely cleans up orphan sessions, accounts, and audit records.
* **Input Validation**: Backend endpoints validate mandatory fields and numeric ranges before initiating database mutations.
* **Safe Public Assets**: Service worker explicitly bypasses `/api/` calls to ensure authentication and data mutations are never stored in browser caches.

---

## 11. Installation and Local Setup

### 11.1 Prerequisites
* **Node.js**: Version 20.x or 22.x LTS installed.
* **NPM**: Version 10+ installed.
* **PostgreSQL Database**: Local PostgreSQL server or Supabase Cloud instance.
* **Git**: Installed for version control.

### 11.2 Step-by-Step Setup
1. **Clone Repository**:
   ```bash
   git clone https://github.com/saikiranrayudu02-cell/wcm-outreach.git
   cd wcm-outreach
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env and supply your PostgreSQL connection string and secrets
   ```

4. **Initialize Database Schema**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed Demo Accounts**:
   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   # Open http://localhost:3000 in your browser
   ```

7. **Verify Production Build**:
   ```bash
   npm run build
   ```

---

## 12. Environment Configuration

All required environment variables are listed in `.env.example`.

| Variable Name | Required | Purpose | Safe Example Value |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host:5432/postgres` |
| `BETTER_AUTH_SECRET` | **Yes** | 32-byte secret for session encryption | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | **Yes** | Canonical deployment root URL | `http://localhost:3000` / `https://wcm-outreach.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Frontend client base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase storage / service URL | `https://[PROJECT-REF].supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Optional | Supabase client anon key | `sb_anon_key_...` |

> [!CAUTION]
> Never commit real `.env` or production credentials to GitHub. Always use `.env.example` as a template and configure secrets directly in the Vercel or hosting platform environment settings.

---

## 13. Testing and Quality Assurance

### 13.1 Build & Compile Testing
* **Next.js Production Compilation**: Verified via `npm run build`. Compiles all 20 static and dynamic routes cleanly with 0 TypeScript errors.
* **Linting**: Verified via `npm run lint` with Next.js ESLint configuration.

### 13.2 Responsive Device Emulation Matrix
Tested using headless browser viewport emulation:
* **320 × 568 (iPhone SE Compact)**: Pass (0 horizontal scroll, stacked cards).
* **375 × 812 (iPhone 11/12/Mini)**: Pass (Full bottom bar, 16px touch inputs).
* **390 × 844 (iPhone 13/14/15)**: Pass (Card layouts and modals aligned).
* **768 × 1024 (iPad Tablet)**: Pass (Sidebar drawer and expanded table views).
* **1280 × 800 (Desktop Laptop)**: Pass (Dual-pane layout with persistent sidebar).

### 13.3 Untested Areas & Recommendations
* Automated end-to-end Cypress or Playwright test suites have not yet been integrated into the repository.
* Unit test coverage (e.g. Jest or Vitest) should be added in future sprints for individual validation functions.

---

## 14. Deployment Documentation

### 14.1 Hosting Platform: Vercel
The application is preconfigured for continuous deployment via **Vercel**:
* **Framework Preset**: Next.js
* **Build Command**: `next build`
* **Install Command**: `npm install`
* **Node.js Version**: 20.x

### 14.2 Supabase IPv4 Pooler Configuration
Direct Supabase connection endpoints (`db.[REF].supabase.co:5432`) are IPv6-only. Serverless platforms like Vercel East (iad1) operate in IPv4 environments and will fail with `PrismaClientInitializationError: Can't reach database server`.
* **Required Fix**: Always configure `DATABASE_URL` using the Supabase IPv4 Pooler address:
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
  ```

### 14.3 Postinstall Generation
`package.json` includes `"postinstall": "prisma generate"`, ensuring the Prisma binary client is automatically compiled during the Vercel build process.

---

## 15. Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `PrismaClientInitializationError` (Can't reach db) | Direct IPv6 Supabase connection used on Vercel | Switch `DATABASE_URL` in Vercel to Supabase Pooler (`aws-0-*.pooler.supabase.com:5432`). |
| Mobile Screen Auto-Zoom on iOS | Form input font-size smaller than 16px | Enforced in `globals.css` with `@media (max-width: 768px) { input { font-size: 16px !important; } }`. |
| Horizontal Scrollbar on Mobile | Missing `overflow-x: clip` or flex child min-width | Ensure `min-w-0 max-w-full` on flex containers and `overflow-x: clip` on `body`. |
| Splash Screen Stuck | JavaScript error in third-party library | Splash screen includes a hard unmount timer at 4.0s. Check browser console. |
| Vercel `allowScripts` Warning | NPM 11 warning for native install scripts | Added `allowScripts` section to `package.json` for Prisma, Bcrypt, and Sharp. |

---

## 16. Limitations and Future Improvements

### 16.1 Verified Limitations
1. **Photo Storage Format**: Currently, user profile pictures and signatures are stored as base64 data URLs directly in the database. For very large image uploads, this increases database footprint.
2. **Automated Integration Tests**: The repository lacks automated unit and E2E test scripts.

### 16.2 Planned Enhancements
1. **Cloud Object Storage**: Transition photo uploads from database base64 strings to Supabase Storage Buckets (`/storage/v1/object`).
2. **Push Notifications**: Integrate Web Push API for native mobile notifications when a report is approved or returned for changes.
3. **Excel / PDF Export**: Add client-side PDF export for individual meeting reports so coordinators can print hard copies for church archives.

---

## 17. User Guide

### 17.1 For Outreach Coordinators
1. **Log In**: Visit `/login`, enter credentials, and tap **Sign In**.
2. **Start a New Report**: On the dashboard, tap **Create New Report**.
3. **Fill Verification Sheet**: Enter host pastor details, church name, phone number, and venue readiness. Tap **Save Draft**.
4. **Fill Attendance Record**: After the outreach service, record member and pastor attendee counts.
5. **Fill After-Meeting Sheet**: Enter observations, congregation response, and textual signature.
6. **Submit**: Once all three tabs reach 100%, tap **Submit Report**.

### 17.2 For Zone & State Leaders
1. **Review Submissions**: Access `/zone-leader/dashboard` or `/state-leader/dashboard`.
2. **Inspect Reports**: Tap **View Details** or **Edit** on any report under review.
3. **Approve or Request Changes**: Enter review remarks. Tap **Approve** to forward or **Request Changes** to return to the coordinator.
4. **View Monthly Summary**: Switch to the **Analytics** tab to view attendance charts and location distribution.

### 17.3 For System Administrators
1. **User Management**: In `/admin/dashboard`, tap **Create User** to register coordinators and leaders.
2. **Announcements**: Switch to **Send Messages** tab to broadcast ministry updates.
3. **Confirmations**: Review upcoming outreach proposals and provide administrative feedback.

---

## 18. Developer Maintenance Guide

### 18.1 Adding a New Field to Reports
1. Update `prisma/schema.prisma` under the relevant model (`VerificationSheet`, `AttendanceRecord`, or `AfterMeetingReport`).
2. Run database migration:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. Update the form state and inputs in `src/app/coordinator/report/[id]/page.tsx`.
4. Update the review view in `src/app/coordinator/dashboard/page.tsx` and admin dashboards.

### 18.2 Adding Translations
1. Open `src/lib/translations.ts`.
2. Add your English key to the `translations` object, providing corresponding strings for `hi` (Hindi) and `te` (Telugu).
3. Use `translate("Your Key", language)` inside any React component.

---

## 19. Glossary and References

### 19.1 Glossary
* **Convener**: The local host pastor or minister organizing the church venue for the WCM outreach meeting.
* **Field Executer**: The designated minister delivering the sermon or executing ministry on the field.
* **PWA (Progressive Web App)**: Web application technology allowing desktop and mobile users to install the portal to their home screen and access offline cached resources.
* **RBAC (Role-Based Access Control)**: Security authorization restricting route access based on user role (`ADMIN`, `STATE_LEADER`, `ZONE_LEADER`, `COORDINATOR`).
* **Supabase Pooler**: An IPv4 transaction and session connection proxy for PostgreSQL databases operating in serverless cloud environments.

### 19.2 References
* **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
* **Prisma ORM Documentation**: [prisma.io/docs](https://www.prisma.io/docs)
* **Better Auth Documentation**: [better-auth.com](https://www.better-auth.com)
* **Tailwind CSS v4 Documentation**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
* **Supabase Connection Pooling**: [supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

*End of Documentation — World Christian Ministry (WCM)*
