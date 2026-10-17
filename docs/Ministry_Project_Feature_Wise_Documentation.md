# WCM Outreach — Ministry Reporting System
## Comprehensive Feature-Wise Application & Business Guide

---

**Application Name**: WCM Ministry Coordinator Reporting System ("WCM Outreach")  
**Organization**: World Christian Ministry (WCM)  
**Target Audience**: Team Leads, Ministry Leaders, Operations Coordinators & Non-Technical Stakeholders  
**Document Version**: 2.0.0 (Feature Edition)  
**Date**: October 17, 2026  
**Document Purpose**: Complete feature explanation, screen workflows, role guidelines, and live presentation demo script  

---

## Table of Contents
1. [Project Introduction](#1-project-introduction)
2. [Application Overview](#2-application-overview)
3. [Complete Feature-Wise Documentation](#3-complete-feature-wise-documentation)
   - [Feature 1: 4-Second Animated Branded Splash Screen](#feature-1-4-second-animated-branded-splash-screen)
   - [Feature 2: Secure Role-Based Sign In & 1-Click Demo Selector](#feature-2-secure-role-based-sign-in--1-click-demo-selector)
   - [Feature 3: Outreach Coordinator Workspace & Activity Center](#feature-3-outreach-coordinator-workspace--activity-center)
   - [Feature 4: Unified 3-Step Meeting Report Builder](#feature-4-unified-3-step-meeting-report-builder)
     - [Sub-Feature 4.1: Verification Sheet (Pre-Meeting Readiness)](#sub-feature-41-verification-sheet-pre-meeting-readiness)
     - [Sub-Feature 4.2: Attendance Record (Live Attendance Capture)](#sub-feature-42-attendance-record-live-attendance-capture)
     - [Sub-Feature 4.3: After-Meeting Evaluation (Outcome & Future Impact)](#sub-feature-43-after-meeting-evaluation-outcome--future-impact)
   - [Feature 5: Meeting Confirmation & Proposal System](#feature-5-meeting-confirmation--proposal-system)
   - [Feature 6: Ministry Personnel Directory ("Find People")](#feature-6-ministry-personnel-directory-find-people)
   - [Feature 7: Full Photo Viewer & Profile Image Download](#feature-7-full-photo-viewer--profile-image-download)
   - [Feature 8: Ministry Announcements & Internal Messaging](#feature-8-ministry-announcements--internal-messaging)
   - [Feature 9: Zone & State Leader Approval Hierarchies](#feature-9-zone--state-leader-approval-hierarchies)
   - [Feature 10: Central Administrative User Provisioning](#feature-10-central-administrative-user-provisioning)
   - [Feature 11: Statistical Analytics & Ministry KPI Summary](#feature-11-statistical-analytics--ministry-kpi-summary)
   - [Feature 12: Multilingual Support (English, Hindi, Telugu)](#feature-12-multilingual-support-english-hindi-telugu)
   - [Feature 13: Theme Switching (Dark Mode & Light Mode)](#feature-13-theme-switching-dark-mode--light-mode)
   - [Feature 14: Personal Profile Management & Password Security](#feature-14-personal-profile-management--password-security)
   - [Feature 15: Progressive Web App (PWA) & Offline Fallback](#feature-15-progressive-web-app-pwa--offline-fallback)
4. [Screen-by-Screen Explanation](#4-screen-by-screen-explanation)
5. [Complete User Journeys](#5-complete-user-journeys)
6. [User Roles and Access Permissions](#6-user-roles-and-access-permissions)
7. [Dashboard and Information Explanation](#7-dashboard-and-information-explanation)
8. [Benefits of the Application](#8-benefits-of-the-application)
9. [Mobile, Tablet, and Desktop Experience](#9-mobile-tablet-and-desktop-experience)
10. [Common User Questions and Troubleshooting](#10-common-user-questions-and-troubleshooting)
11. [Project Demonstration Guide (Team Lead Presentation Script)](#11-project-demonstration-guide-team-lead-presentation-script)
12. [Feature Inventory and Completeness Checklist](#12-feature-inventory-and-completeness-checklist)

---

## 1. Project Introduction

### What is this application?
The **WCM Ministry Coordinator Reporting System** (commonly called **WCM Outreach**) is a digital reporting and communication portal designed specifically for **World Christian Ministry (WCM)**. It allows outreach workers, field coordinators, regional pastors, and senior administrators to organize, report, review, and evaluate outreach meetings across multiple districts and states.

### Why was it developed?
World Christian Ministry organizes dozens of outreach meetings, gospel crusades, pastors' conferences, and prayer vigils across different territories. Previously, information about these meetings was scattered across phone calls, handwritten notes, and instant messaging chats. Reports were submitted late, attendee numbers were estimated without verification, and host church arrangements could not be monitored in advance. 

WCM Outreach was developed to bring **order, accountability, transparency, and structure** to the ministry's fieldwork.

### What problem does it solve?
1. **No More Lost or Incomplete Reports**: All report data (venue readiness, attendance counts, visiting pastors, congregation feedback) is saved into one central system.
2. **Advance Venue Verification**: Coordinators verify stage readiness, sound systems, accommodation, and crowd expectations *before* the preaching team arrives.
3. **Structured Leadership Approvals**: When a coordinator submits a report, it automatically flows up to the Zone Leader, then the State Leader, and finally the Central Admin for review and sign-off.
4. **Immediate Visibility into Outreach Growth**: Senior leadership can instantly view total meetings conducted, total attendees, new followers, and location breakdowns through visual charts.
5. **Direct Directory Access**: Field workers can quickly look up fellow coordinators and leaders by name or phone number and call or message them directly.

### Who can use it?
* **Outreach Coordinators**: Field workers who meet with local pastors, arrange venues, record attendee numbers, and submit post-meeting evaluations.
* **Zone Leaders**: Regional overseers who supervise all coordinators and meetings within an assigned Zone (e.g., Zone-1).
* **State Leaders**: Senior leaders who oversee ministry operations for an entire state (e.g., Andhra Pradesh).
* **System Administrators**: Central leadership with full authority to add workers, broadcast ministry announcements, review proposals, and analyze nationwide trends.

### What makes this application useful?
* **Zero Coding Knowledge Required**: Clean buttons, simple forms, auto-saving drafts, and helpful instructions guide users at every step.
* **Works on Every Device**: Tailored for mobile phones on the field, tablets during pastoral committee meetings, and desktop computers in the central office.
* **Works Even in Remote Areas**: Thanks to Progressive Web App (PWA) technology, the application loads quickly even on slower 3G/4G connections and provides a clear offline guide if connectivity drops.
* **Speaks the User's Language**: Instant switching between **English**, **Hindi (हिंदी)**, and **Telugu (తెలుగు)**.

---

## 2. Application Overview

When a user interacts with the WCM Outreach platform, the experience is organized into an intuitive, seamless workflow:

```
+-----------------------------------------------------------------------------------+
|                              1. APPLICATION LAUNCH                                |
|   - 4-Second Branded Splash Screen with official WCM logo, glow rings & progress  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                2. SIGN IN PAGE                                    |
|   - Login with Username & Password                                                |
|   - 1-Click Demo Account Selector for rapid testing & evaluation                  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        3. ROLE-BASED DASHBOARD ROUTING                            |
+-----------------------------------------------------------------------------------+
         |                             |                          |
         v                             v                          v
+---------------------+     +---------------------+    +---------------------+
|    COORDINATOR      |     |  ZONE/STATE LEADER  |    |    ADMINISTRATOR    |
| - Create Reports    |     | - Review Reports    |    | - User Management   |
| - Upcoming Proposals|     | - Edit & Forward    |    | - Announcements     |
| - View Feedback     |     | - Monthly Summary   |    | - Global Approvals  |
+---------------------+     +---------------------+    +---------------------+
                                         |
                                         +-----------------------+
                                         |                       |
                                         v                       v
                         +-----------------------+   +-----------------------+
                         |      FIND PEOPLE      |   |      MY PROFILE       |
                         | - Directory Search    |   | - Photo Upload        |
                         | - Phone & Email links |   | - Password Change     |
                         | - Full Photo Download |   | - App Installation    |
                         +-----------------------+   +-----------------------+
```

### Core Navigation
* **On Mobile Phones**: Users navigate using a fixed bottom navigation bar containing direct taps to **Dashboard**, **Confirmations**, **Find People**, **Profile**, and **Notifications**.
* **On Desktop & Tablets**: A deep indigo sidebar is visible on the left side, providing one-click access to all sections, language selection, dark/light theme toggle, and account sign-out.

---

## 3. Complete Feature-Wise Documentation

---

### Feature 1: 4-Second Animated Branded Splash Screen

#### What Is This Feature?
A full-screen opening screen featuring the official World Christian Ministry logo, glowing concentric rings, a smooth progress bar, and the organization's name. It automatically displays for exactly **4 seconds** whenever the application is launched or refreshed.

#### Why Is It Needed?
* Establishes a professional, respectful ministry brand identity right from the first second.
* Smoothly masks background data loading and authentication session checks so the user never sees a jarring white flicker or broken layout.

#### How Does It Work?
1. The user opens the application URL on their phone or computer.
2. The branded splash screen appears immediately with soft indigo ambient glows.
3. Three concentric rings pulse outward, the official logo floats into position, and a loading bar progresses from 0% to 100%.
4. At 3.4 seconds, the splash screen gently fades out, revealing the application content at 4.0 seconds.

#### What Can the User Do?
* The user simply observes the brief welcome sequence; no clicks or taps are required.

#### What Is the Benefit?
* Creates an immediate sense of trust and premium quality for church pastors, leaders, and visiting ministry delegates.

#### Practical Example
A coordinator arrives at a rural church and launches the app on their mobile phone to show the local pastor where their church meeting details will be officially recorded. The branded opening sequence reinforces that this is an official World Christian Ministry system.

#### Related Screens
* App Startup (`/`)
* Login Page (`/login`)

---

### Feature 2: Secure Role-Based Sign In & 1-Click Demo Selector

#### What Is This Feature?
A secure login portal where ministry personnel enter their unique username and password. Below the form, a **Quick Demo Accounts** panel allows leaders or testers to log in as an Admin, Coordinator, State Leader, or Zone Leader with a single tap.

#### Why Is It Needed?
* Protects sensitive ministry records, pastor contact numbers, and internal evaluations from unauthorized public access.
* Eliminates the frustration of remembering or typing complex test passwords during board presentations or training workshops.

#### How Does It Work?
1. The user navigates to `/login`.
2. To log in with their assigned account:
   * Enters their username (or email) and password.
   * Taps the eye icon to verify what they typed.
   * Taps **Sign In**.
3. To test with a demo account:
   * Taps any of the demo account badges (**Admin**, **Coordinator**, **State Leader**, or **Zone Leader**).
   * The system instantly fills the username and password fields and shows a confirmation toast.
   * Taps **Sign In** to immediately enter that role's dashboard.

#### What Can the User Do?
* Enter credentials securely.
* Reveal or hide password characters.
* Select preconfigured demo accounts for fast demonstrations.

#### What Is the Benefit?
* Guarantees secure data access while making team demos, leadership reviews, and new worker onboarding effortless.

#### Related Screens
* Login Screen (`/login`)
* Assigned role dashboard (`/coordinator/dashboard`, `/zone-leader/dashboard`, etc.)

---

### Feature 3: Outreach Coordinator Workspace & Activity Center

#### What Is This Feature?
The main operational command center for outreach coordinators. It features a personalized greeting, quick buttons to start new reports or propose meetings, an announcements board from senior leadership, and an organized list of all past and current meeting reports.

#### Why Is It Needed?
Coordinators manage multiple outreach meetings across different weekends. They need a single clean screen where they can see which reports are saved as drafts, which have been approved, and which require corrections.

#### How Does It Work?
1. The coordinator logs in and is taken directly to `/coordinator/dashboard`.
2. At the top, the coordinator sees their name and role.
3. In the center, two action cards allow them to **Create New Report** or **Manage Confirmations**.
4. Below that, the **Admin Announcements** panel displays notices sent from headquarters.
5. At the bottom, the **My Meeting Reports** list displays all reports with their serial number, meeting dates, venue location, version, and colorful status badges (**Draft**, **Submitted**, **Approved**, **Changes Requested**).

#### What Can the User Do?
* Start a brand new meeting report.
* Continue editing an existing draft report.
* Delete an unsubmitted draft report that was created by mistake.
* View finalized reports in a read-only detail window.
* Mark announcement messages as read.

#### What Is the Benefit?
* Eliminates paperwork and lost files. Coordinators can track the exact review status of every single meeting they conduct.

#### Related Screens
* Coordinator Dashboard (`/coordinator/dashboard`)
* Report Editor (`/coordinator/report/[id]`)
* Meeting Confirmations (`/coordinator/confirmations`)

---

### Feature 4: Unified 3-Step Meeting Report Builder

#### What Is This Feature?
A guided, 3-section digital report wizard that brings together everything that happens before, during, and after an outreach meeting.

#### Why Is It Needed?
Previously, venue checks, attendee counts, and outcome reports were recorded on separate sheets or communicated through text messages at different times. The Report Builder links all three phases into one permanent record with a unique identifier (e.g. `MR-2026-00015`).

---

#### Sub-Feature 4.1: Verification Sheet (Pre-Meeting Readiness)
* **What it does**: Gathers all venue preparation details before the meeting begins.
* **Information captured**:
  * Local Convener / Host Pastor Name and Ministry Name.
  * Location (State, District, City).
  * Host contact phone number.
  * Scheduled meeting dates and duration in days.
  * Expected congregation attendance.
  * Host pastor's years in ministry and registered church members.
  * Discover source: How the host learned about WCM (e.g. YouTube messages, books).
  * Prior attendance at meetings by Prophet Kiran.
  * Venue readiness: Stage arrangement, sound system quality, accommodation for ministry team, and local volunteer support.
* **Why it matters**: Prevents surprises on the day of the meeting. The preaching team knows in advance whether the sound system and stage are ready.

---

#### Sub-Feature 4.2: Attendance Record (Live Attendance Capture)
* **What it does**: Records accurate counts of people who participated in the service.
* **Information captured**:
  * Exact service date and location.
  * Field executer (minister) and coordinator names.
  * Number of church members who attended.
  * Number of visiting pastors/ministers who attended.
  * General coordinator remarks and observations during the service.
* **Why it matters**: Gives leadership honest, verifiable statistics on crowd sizes and pastoral engagement.

---

#### Sub-Feature 4.3: After-Meeting Evaluation (Outcome & Future Impact)
* **What it does**: Evaluates the spiritual, ministerial, and relational outcomes after the service concludes.
* **Information captured**:
  * Overall meeting outcome (e.g., "Deep Spiritual Revival", "Miraculous Healing Service").
  * Congregation and host pastor response.
  * Desire for continued fellowship with WCM.
  * Future event opportunities (Checkboxes for Youth Meeting, Women Meeting, Pastors' Conference, Fasting Prayer, Night Vigil, etc.).
  * Observed strengths and challenges encountered during the event.
  * Count of new believers or believers now following WCM literature and broadcasts.
  * Official coordinator name, title, signature, and submission date.
* **Why it matters**: Helps the ministry plan follow-up visits and cultivate ongoing partnerships with local churches.

#### How Does the Complete Builder Work?
1. The coordinator opens a report and sees a **Progress Tracker** showing completion percentage (e.g., 67%).
2. Taps **Section 1: Verification** and fills in the fields.
3. Taps **Save Draft** at any time; the system safely stores progress without submitting.
4. Moves to **Section 2: Attendance** and records crowd figures.
5. Moves to **Section 3: After Meeting** and enters evaluations.
6. When all sections are filled, the progress bar reaches 100% and the **Submit Report** button activates.
7. Tapping **Submit Report** locks the report and forwards it up to the Zone Leader for review.

#### What Is the Benefit?
* Guarantees 100% complete records. Incomplete reports cannot be submitted accidentally.

#### Related Screens
* Report Builder (`/coordinator/report/[id]`)
* Coordinator Dashboard (`/coordinator/dashboard`)

---

### Feature 5: Meeting Confirmation & Proposal System

#### What Is This Feature?
A formal proposal module where coordinators request administrative approval before finalizing an upcoming outreach meeting.

#### Why Is It Needed?
Prevents overlapping schedules and uncoordinated dates. It allows senior leadership to review the location and expected crowd size before giving the green light.

#### How Does It Work?
1. The coordinator navigates to `/coordinator/confirmations`.
2. Taps **Request Confirmation**.
3. A modal opens where the coordinator inputs:
   * Proposed Venue & Church Location.
   * Proposed Dates (e.g., "Nov 14th – Nov 16th, 2026").
   * Expected Attendance (e.g., 250).
   * Proposal description (objectives, local pastor background, travel plans).
4. Taps **Submit Proposal**.
5. The request appears on the Admin Dashboard with a yellow **Pending** badge.
6. The Admin reviews the proposal and either marks it **Approved** or **Rejected**, adding written guidance (e.g., "Approved. Ensure audio engineer travels a day in advance.").
7. The coordinator sees the decision and admin comments immediately on their dashboard.

#### What Can the User Do?
* Coordinators can submit proposals and track approval status.
* Admins can approve, reject, and write advisory feedback.

#### What Is the Benefit?
* Eliminates schedule clashes and ensures proper planning and budget allocation for every outreach event.

#### Related Screens
* Coordinator Confirmations (`/coordinator/confirmations`)
* Admin Dashboard Confirmations Tab (`/admin/dashboard`)

---

### Feature 6: Ministry Personnel Directory ("Find People")

#### What Is This Feature?
An intelligent, searchable address book of all ministry personnel, coordinators, and regional leaders across the organization.

#### Why Is It Needed?
Coordinators and regional overseers frequently need to contact one another when traveling, organizing joint district crusades, or transferring church contacts.

#### How Does It Work?
1. The user taps **Find People** on the navigation bar.
2. The user sees cards for team members showing their profile picture, full name, username, and role badge (**Coordinator**, **Zone Leader**, **State Leader**, **System Admin**).
3. The user types a name or phone number into the live search bar; matching cards filter instantly as they type.
4. The user can filter by role (e.g. show only Zone Leaders).
5. Tapping any person's card opens their **Candidate Profile** modal.
6. The profile reveals their direct phone number (clickable to call), email (clickable to compose an email), assigned State/Zone, and a record of how many reports they have submitted and had approved.

#### What Can the User Do?
* Search people by name or phone number.
* Tap phone numbers to make direct telephone calls from mobile devices.
* Tap email addresses to open default mail apps.
* View assigned jurisdiction (State, Zone, Part).
* View outreach activity history.

#### Role-Based Scoping
* **Admins** search nationwide across all states and roles.
* **State Leaders** search across their assigned state.
* **Zone Leaders** search across coordinators in their zone.

#### What Is the Benefit?
* Keeps the entire ministry team connected in real time without having to ask headquarters for contact details.

#### Related Screens
* Directory Page (`/find-people`)

---

### Feature 7: Full Photo Viewer & Profile Image Download

#### What Is This Feature?
An integrated high-resolution photo viewer that allows users to tap on any worker's profile picture, view it in a clean modal overlay, and download the full-resolution photo to their phone or computer.

#### Why Is It Needed?
Ministry teams frequently produce meeting brochures, event banners, and promotional posters. Leaders need quick access to high-quality photos of pastors and coordinators without waiting for email attachments.

#### How Does It Work?
1. On the **Find People** page, the user taps the zoom icon on any person's avatar photo.
2. A full-screen dark modal appears with the candidate's name, role, and the large profile photo.
3. The user taps **Download Photo**.
4. The application automatically downloads the picture file directly to the device's downloads folder.

#### What Is the Benefit?
* Saves time for graphic designers and media teams creating event announcements and ID badges.

#### Related Screens
* Directory Page (`/find-people`)

---

### Feature 8: Ministry Announcements & Internal Messaging

#### What Is This Feature?
An internal notification and announcement bulletin board that enables leadership to dispatch broadcast updates or direct messages to workers.

#### Why Is It Needed?
Important ministry announcements often get drowned out in commercial messaging apps. Having an announcement board directly inside the outreach reporting portal ensures critical notices are seen where work is done.

#### How Does It Work?
1. An Admin or Zone Leader opens their dashboard and taps the **Send Messages** tab.
2. Selects the recipient coordinator (or broadcast group), types a subject title, and enters the message text.
3. Taps **Send Message**.
4. When the coordinator opens the app, a red notification pill pings on the top navigation bell.
5. The message appears in their **Admin Announcements** panel.
6. Tapping **Mark Read** clears the unread indicator.

#### What Can the User Do?
* Leaders can dispatch direct announcements.
* Coordinators can read notices and mark them as reviewed.
* On mobile, tapping the notification bell opens an animated slide-up bottom sheet.

#### What Is the Benefit?
* Centralized, official communication channel dedicated exclusively to ministry business.

#### Related Screens
* Top Navbar / Notification Bell
* Mobile Notification Bottom Sheet
* Admin & Zone Leader Dashboards (`/admin/dashboard`, `/zone-leader/dashboard`)

---

### Feature 9: Zone & State Leader Approval Hierarchies

#### What Is This Feature?
Specialized review consoles where Zone and State Leaders inspect reports submitted by coordinators under their jurisdiction.

#### Why Is It Needed?
Quality control and verification. Senior leaders must confirm that attendee numbers, host statements, and venue details are accurate before reports are permanently archived.

#### How Does It Work?
1. When a coordinator submits a report, it appears in the Zone Leader's **Submitted Reports** list.
2. The Zone Leader taps **View Details** to review the Verification Sheet, Attendance Record, and After-Meeting Evaluation.
3. If details need adjustment (for example, the coordinator misspelled the church address), the Zone Leader can tap **Edit Report** to make direct corrections.
4. The leader has three review options:
   * **Approve & Forward**: Approves the report and forwards it up to the State Leader or Admin.
   * **Request Changes**: Rejects the submission back to the coordinator with specific written feedback (e.g. "Please upload the visiting pastors count"). The coordinator's status changes to `REQUEST_CHANGES` so they can edit and resubmit.
   * **Reject**: Closes the report if the meeting did not occur.
5. All actions are stamped into the report's **Activity Log** showing who approved it and when.

#### What Is the Benefit?
* Complete accountability. No report reaches central leadership without regional verification.

#### Related Screens
* Zone Leader Dashboard (`/zone-leader/dashboard`)
* State Leader Dashboard (`/state-leader/dashboard`)

---

### Feature 10: Central Administrative User Provisioning

#### What Is This Feature?
An administrative console for creating, updating, and managing ministry worker accounts.

#### Why Is It Needed?
Because this is an official internal ministry portal, accounts cannot be created by random public users. Central leadership must control who receives access and what role they are assigned.

#### How Does It Work?
1. The Admin logs in and taps **Create User** on `/admin/dashboard`.
2. Fills in the worker's Full Name, Login Username, Email, Phone Number, Password, and Role (**Coordinator**, **Zone Leader**, or **State Leader**).
3. If assigning a Coordinator or Leader, selects their assigned **State**, **Zone**, and **Part**.
4. Taps **Create User**. The worker can immediately log in with those credentials.
5. If a worker forgets their password or moves to a new district, the Admin taps **Edit** on their profile to update their phone number, jurisdiction, or reset their password.

#### What Can the User Do?
* Add new ministry workers.
* Update worker contact details and territory assignments.
* Reset forgotten passwords.
* Deactivate or delete accounts when a worker leaves the ministry.

#### What Is the Benefit?
* Total administrative control over who accesses the ministry's confidential outreach records.

#### Related Screens
* Admin Dashboard Users Tab (`/admin/dashboard`)

---

### Feature 11: Statistical Analytics & Ministry KPI Summary

#### What Is This Feature?
An interactive visual analytics dashboard that summarizes ministry outreach performance across any selected month and year.

#### Why Is It Needed?
Senior leaders and board members need macro-level reports to understand outreach growth, evaluate territorial impact, and report to ministry sponsors.

#### How Does It Work?
1. An Admin, State Leader, or Zone Leader switches to the **Analytics** tab.
2. Selects a **Month** (e.g. October) and **Year** (e.g. 2026).
3. The dashboard instantly displays three top KPI summary cards:
   * **Total Meetings Conducted**: Total verified outreach services held in that period.
   * **Total Members Attended**: Total congregation attendee count across all meetings.
   * **Members Following WCM**: Total new believers and followers who connected with WCM literature and broadcasts.
4. Below the cards, two visual charts are rendered:
   * **Location Coverage (Pie Chart)**: A circular chart breaking down which cities/districts held the most meetings.
   * **Monthly Outreach Trends (Bar Chart)**: A 12-month bar chart showing the rise and fall of meeting counts and attendance over the course of the year.

#### What Is the Benefit?
* Turns raw field numbers into clear, executive-ready charts for ministry planning and evaluation.

#### Related Screens
* Monthly Summary Component (`src/components/monthly-summary.tsx`)
* Analytics Tabs on Leader Dashboards

---

### Feature 12: Multilingual Support (English, Hindi, Telugu)

#### What Is This Feature?
A 1-click language switcher in the top navigation bar that instantly translates the interface into **English**, **Hindi (हिंदी)**, or **Telugu (తెలుగు)**.

#### Why Is It Needed?
World Christian Ministry operates heavily in Andhra Pradesh, Telangana, and North India. Many field coordinators and local pastors are more comfortable reading forms in their regional mother tongue.

#### How Does It Work?
1. The user taps the language dropdown in the top bar (displays `EN`, `HI`, or `TE`).
2. Selecting `TE` immediately updates all headings, button titles, navigation labels, and form prompts into Telugu.
3. Selecting `HI` updates everything into Hindi.
4. The user's preference is remembered across their entire session.

#### What Is the Benefit?
* Removes language barriers, ensuring field workers across rural regions can use the system confidently without making errors.

#### Related Screens
* Top Navbar on every screen
* All forms and dashboards

---

### Feature 13: Theme Switching (Dark Mode & Light Mode)

#### What Is This Feature?
A toggle button on the top navigation bar allowing users to switch between a crisp **Light Mode** and an immersive, eye-friendly **Dark Mode**.

#### Why Is It Needed?
Coordinators often work outdoors in bright sunlight (where high-contrast Light Mode is needed) and late at night in church venues or lodging (where Dark Mode reduces eye strain and saves phone battery).

#### How Does It Work?
1. The user taps the **Sun / Moon** icon in the top navbar.
2. The interface smoothly transitions between the indigo-slate dark aesthetic and the crisp white light aesthetic.
3. All cards, tables, inputs, and text adapt their contrast automatically.

#### What Is the Benefit?
* Enhanced user comfort in any lighting environment.

#### Related Screens
* Top Navbar across all pages

---

### Feature 14: Personal Profile Management & Password Security

#### What Is This Feature?
A dedicated personal account page (`/profile`) where every worker can view their credentials, upload their photo, and change their password.

#### Why Is It Needed?
Gives workers ownership over their identity and credentials without requiring them to contact the administrator for simple personal updates.

#### How Does It Work?
1. The user navigates to `/profile` from the sidebar or mobile bottom bar.
2. **Hero Banner**: Displays their full name, role badge, assigned state/zone, and join date.
3. **Photo Upload**: Tapping the blue camera badge on the avatar allows the user to take a new selfie or select a photo from their phone. The photo updates immediately.
4. **Change Password**: The user inputs their current password, types a new password, confirms it, and taps **Update Password**.

#### What Can the User Do?
* Upload or remove their profile picture.
* Update their name and phone number.
* Securely update their account password.
* Install the application as a PWA on their device.

#### What Is the Benefit?
* Self-service profile maintenance and enhanced account security.

#### Related Screens
* Profile Page (`/profile`)

---

### Feature 15: Progressive Web App (PWA) & Offline Fallback

#### What Is This Feature?
Technology that allows WCM Outreach to be installed directly on a phone or computer like a native app from the App Store or Google Play, complete with an offline screen when internet is disconnected.

#### Why Is It Needed?
Outreach meetings frequently take place in rural villages or church halls with poor cell coverage. Users need the app to remain installable, load quickly, and explain clearly when the device is disconnected.

#### How Does It Work?
1. When opened on an iPhone (Safari) or Android (Chrome), a banner prompts the user to **Install App**.
2. Installing it places the official WCM icon on the phone's home screen.
3. The app opens full-screen without browser address bars.
4. If internet connectivity drops completely, attempting to navigate displays the branded **You're Currently Offline** screen (`offline.html`) with a retry button.

#### What Is the Benefit?
* Native app feel without needing complex app store approvals or frequent manual app store updates.

#### Related Screens
* Home screen icon
* Offline Screen (`/offline.html`)

---

## 4. Screen-by-Screen Explanation

---

### Screen 1: Sign In Page (`/login`)
* **Purpose**: Gateway to the application for all users.
* **Information Displayed**: Official WCM Logo, "WCM Ministry — Reporting & Outreach Platform" subtitle, username and password input fields, sign-in button, and the Quick Demo Accounts grid.
* **Key Buttons**:
  * `Password Visibility (Eye)`: Reveals or conceals typed password characters.
  * `Sign In`: Validates credentials and redirects the user to their appropriate role dashboard.
  * `Admin / Coordinator / State Leader / Zone Leader Demo Badges`: 1-tap test credential autofill.
* **Next Screen**: Takes the user to their designated dashboard (`/coordinator/dashboard`, etc.).

---

### Screen 2: Coordinator Dashboard (`/coordinator/dashboard`)
* **Purpose**: Central hub for field coordinators.
* **Information Displayed**: Welcome greeting with coordinator's name, module cards for Reports and Confirmations, latest administrative announcements, and a table/card list of all submitted reports.
* **Key Buttons**:
  * `Create New Report`: Generates an empty meeting report draft and navigates directly to the Report Builder.
  * `Manage Confirmations`: Navigates to the meeting proposal management screen.
  * `Mark Read`: Clears announcement notification pings.
  * `Edit (Pencil)`: Opens an unfinalized draft report in the builder.
  * `Delete (Trash)`: Deletes an unneeded draft report.
  * `View (Eye)`: Opens the complete read-only summary modal for an approved report.
* **Next Screen**: Leads to `/coordinator/report/[id]` or `/coordinator/confirmations`.

---

### Screen 3: Meeting Report Builder (`/coordinator/report/[id]`)
* **Purpose**: Unified workspace for compiling Verification, Attendance, and After-Meeting reports.
* **Information Displayed**: Report ID (e.g. `MR-2026-00015`), current status pill, overall completion percentage bar, reviewer comments alert box (if changes were requested), and 3 section step tabs.
* **Key Buttons**:
  * `Back to Dashboard`: Returns to the coordinator dashboard safely.
  * `Save Draft`: Immediately writes current form inputs to the database without submitting.
  * `Submit Report`: Performs validation check and locks the report, forwarding it to the Zone Leader.
  * `Section 1 / Section 2 / Section 3 Tabs`: Switches active form view.
* **Next Screen**: Returns to `/coordinator/dashboard` upon successful submission.

---

### Screen 4: Meeting Confirmations (`/coordinator/confirmations`)
* **Purpose**: Proposing upcoming meetings and tracking administrative approvals.
* **Information Displayed**: Table and cards of past meeting proposals showing Venue, Dates, Expected Attendees, Status (`PENDING`, `APPROVED`, `REJECTED`), and Administrator Feedback quotes.
* **Key Buttons**:
  * `Request Confirmation`: Opens the proposal submission modal.
  * `Submit Proposal`: Sends the proposed venue, date, and crowd details to headquarters.
  * `Cancel`: Discards the proposal modal.
* **Next Screen**: Updates list in place.

---

### Screen 5: Personnel Directory ("Find People") (`/find-people`)
* **Purpose**: Searching and inspecting ministry team members.
* **Information Displayed**: Search bar, role filter dropdown, total candidates counter, and member cards showing avatar, name, username, phone number, email, and territory jurisdiction.
* **Key Buttons**:
  * `Search Input`: Instant live text filter by name or telephone.
  * `Role Dropdown`: Filters by role category.
  * `Refresh`: Re-fetches the latest personnel list.
  * `Member Card`: Opens the comprehensive candidate profile modal.
  * `Zoom (Eye) on Avatar`: Launches the high-resolution photo viewer and download modal.
  * `Download Photo`: Saves high-res picture to device.
* **Next Screen**: Modal overlays; remains on `/find-people`.

---

### Screen 6: Zone & State Leader Dashboards (`/zone-leader/dashboard`, `/state-leader/dashboard`)
* **Purpose**: Regional leadership review, coordinator supervision, and analytics inspection.
* **Information Displayed**: 5-tab switcher (**User Management**, **Submitted Reports**, **Send Messages**, **Confirmations**, **Analytics**), coordinator cards, and report review queues.
* **Key Buttons**:
  * `View Details`: Launches the multi-sheet report inspection modal.
  * `Edit Report`: Allows the leader to correct typos or missing venue details directly.
  * `Approve`: Advances the report status to the next tier.
  * `Request Changes`: Prompts for written review comments and returns the report to the coordinator.
  * `Month / Year Selectors`: Updates the KPI summary cards, location pie chart, and monthly bar chart.
* **Next Screen**: Modals and tab switches in place.

---

### Screen 7: Admin Control Console (`/admin/dashboard`)
* **Purpose**: Full organizational command and worker administration.
* **Information Displayed**: Personnel management table, system-wide submitted reports, message broadcasting panel, and proposal decision queues.
* **Key Buttons**:
  * `Create User`: Opens the worker registration modal to add new coordinators and leaders.
  * `Edit (Pencil) on User`: Allows updating territory assignments, phone numbers, or resetting passwords.
  * `Delete (Trash) on User`: Deactivates and removes an account.
  * `Approve / Reject on Confirmations`: Approves or denies upcoming outreach meeting proposals with custom feedback.
* **Next Screen**: Modal overlays and tab switches in place.

---

### Screen 8: My Profile (`/profile`)
* **Purpose**: Worker identity management and personal security.
* **Information Displayed**: Large profile avatar, full name, role badge, email, phone number, member since date, assigned jurisdiction pill, activity counters, and password change form.
* **Key Buttons**:
  * `Camera Icon`: Opens camera/photo picker to upload or change avatar.
  * `Remove Photo`: Reverts profile image to generic initials avatar.
  * `Update Details`: Saves name and phone number changes.
  * `Update Password`: Encrypts and saves new account password.
* **Next Screen**: Remains on `/profile`.

---

## 5. Complete User Journeys

---

### Journey 1: Coordinator Outreach Lifecycle
* **Goal**: Conduct an outreach meeting and file a verified report from start to finish.
* **Step 1 (Proposal)**: Two weeks before the meeting, the coordinator opens `/coordinator/confirmations`, taps **Request Confirmation**, submits the church location and estimated crowd of 200, and receives an **Approved** notice from headquarters.
* **Step 2 (Verification)**: Two days before the event, the coordinator visits the church, checks the sound system and stage, taps **Create New Report**, fills out **Section 1 (Verification)**, and taps **Save Draft**.
* **Step 3 (Attendance)**: During Sunday service, the coordinator counts 215 members and 12 visiting pastors. The coordinator opens the draft report, enters the numbers into **Section 2 (Attendance)**, and saves.
* **Step 4 (Evaluation)**: That evening, the coordinator fills out **Section 3 (After Meeting)**, noting that the congregation requested a monthly youth meeting. The coordinator enters their textual signature.
* **Step 5 (Submission)**: The progress bar displays 100%. The coordinator taps **Submit Report**. The report is locked and forwarded to the Zone Leader.

---

### Journey 2: Regional Review and Approval
* **Goal**: Zone Leader reviews and validates the coordinator's submission.
* **Step 1 (Notification)**: The Zone Leader logs in and sees a new report listed under **Submitted Reports**.
* **Step 2 (Inspection)**: Taps **View Details** and checks all three sections.
* **Step 3 (Decision)**:
  * *Path A (Approved)*: Everything is in order. The leader selects **Approve & Forward** $\to$ **State Leader & Admin**. The report status updates to `APPROVED` and is permanently archived into ministry records.
  * *Path B (Changes Needed)*: The coordinator forgot to enter the contact number for the host pastor. The leader taps **Request Changes**, types *"Please provide host pastor contact number"*, and submits. The report returns to the coordinator with an amber alert box detailing the leader's comment.

---

### Journey 3: Personnel Directory Lookup
* **Goal**: A visiting state leader needs to contact the local coordinator in Guntur.
* **Step 1**: The leader taps **Find People** on their mobile phone.
* **Step 2**: Types *"Guntur"* or the coordinator's name into the search bar.
* **Step 3**: The matching coordinator's card appears.
* **Step 4**: The leader taps the phone number and their phone immediately dials the coordinator.

---

## 6. User Roles and Access Permissions

| Feature / Action | Coordinator | Zone Leader | State Leader | System Admin |
| :--- | :---: | :---: | :---: | :---: |
| **View Own Dashboard & Reports** | Yes | Yes | Yes | Yes |
| **Create New Meeting Reports** | Yes | No | No | No |
| **Save Drafts & Edit Own Reports**| Yes | No | No | No |
| **Submit Proposals (Confirmations)**| Yes | No | No | No |
| **Approve / Reject Proposals** | No | No | No | **Yes** |
| **Review & Approve Reports** | No | **Yes (Zone)** | **Yes (State)** | **Yes (Global)** |
| **Directly Edit Reports During Review**| No | **Yes** | **Yes** | **Yes** |
| **Return Reports for Changes** | No | **Yes** | **Yes** | **Yes** |
| **Search Personnel Directory** | No | **Yes (Zone)** | **Yes (State)** | **Yes (Global)** |
| **Send Announcements / Messages** | No | **Yes (Zone)** | **Yes (State)** | **Yes (Global)** |
| **View Monthly Summary Analytics** | No | **Yes (Zone)** | **Yes (State)** | **Yes (Global)** |
| **Create / Delete User Accounts** | No | No | No | **Yes** |
| **Update Personal Profile & Password**| Yes | Yes | Yes | Yes |

---

## 7. Dashboard and Information Explanation

When leaders look at the **Analytics & Monthly Summary** panel, they see three major metrics:

### 1. Total Meetings Conducted
* **What it means**: The total count of outreach meetings held within that specific month and year that reached `APPROVED` status.
* **Why it matters**: Demonstrates organizational activity and tracks whether the ministry is meeting its monthly outreach target.

### 2. Total Members Attended
* **What it means**: The combined sum of all congregation members and visitors recorded in the Attendance records of approved reports.
* **Why it matters**: Quantifies ministry reach and crowd engagement across all participating churches.

### 3. Members Following WCM
* **What it means**: The number of new individuals who requested WCM literature, subscribed to media broadcasts, or registered for follow-up discipleship.
* **Why it matters**: Reflects long-term spiritual fruit and ongoing connection beyond the initial Sunday meeting.

### 4. Location Distribution (Pie Chart)
* **What it means**: A breakdown showing what percentage of meetings occurred in each city or district (e.g. 50% in Vijayawada, 30% in Guntur, 20% in Visakhapatnam).
* **Actionable Insight**: Helps leadership identify neglected districts where more outreach initiatives should be planned.

---

## 8. Benefits of the Application

* **Eliminates Lost Information**: All venue checks, attendance counts, and photos reside in one secure database.
* **100% Truthful Accountability**: Audit logs track every edit, approval, and comment with timestamps and leader names.
* **Faster Decision-Making**: No waiting for monthly paper files to be posted to headquarters. Reports appear in real time.
* **Empowers Field Workers**: Field coordinators have clear, structured checklists so they never forget to verify sound, stage, or lodging.
* **Cost Savings**: Drastically reduces administrative overhead, phone calls, and manual spreadsheet compiling.

---

## 9. Mobile, Tablet, and Desktop Experience

### On Mobile Phones (iOS Safari & Android Chrome)
* **Tested Viewports**: `320px` (iPhone SE), `375px` (iPhone 11/12), `390px` (iPhone 13/14/15).
* **Ergonomic Bottom Bar**: Navigation moves to a fixed bottom navigation bar within thumb reach.
* **Zero Accidental Zoom**: Text inputs use an explicit 16px size to prevent iOS Safari from zooming in unexpectedly.
* **Stacked Touch Cards**: Complex wide tables automatically transform into clean, vertical touch cards.

### On Tablets (iPad & Android Tablets)
* **Tested Viewports**: `768px` and `1024px` in portrait and landscape.
* **Hybrid View**: Provides quick drawer navigation, dual-pane cards, and expanded attendance data tables.

### On Desktop Computers (Laptops & Office PCs)
* **Tested Viewports**: `1280px` and `1440px`.
* **Full Command Center**: Persistent left-hand gradient sidebar, full-width data tables with sorting, and side-by-side analytics charts.

---

## 10. Common User Questions and Troubleshooting

#### Q1: Why can't I click "Submit Report"?
* **Answer**: The **Submit Report** button only turns blue and activates when all three sections (Verification, Attendance, and After Meeting) reach 100% completion. Check that all mandatory fields (marked with red asterisks) have been filled.

#### Q2: What should I do if my report was returned with "Changes Requested"?
* **Answer**: Open `/coordinator/dashboard`, find the report marked with the amber badge, and tap **Edit**. An amber box at the top of the builder will display the exact notes from your reviewer. Update the requested information and tap **Submit Report** again.

#### Q3: Can I save my work if I haven't finished the meeting yet?
* **Answer**: Yes! Tap **Save Draft** at any time. You can close the app and return days later to finish the report.

#### Q4: What happens if I lose internet connection while filling a form?
* **Answer**: The application service worker keeps the app loaded. If you attempt to refresh without signal, the branded offline screen will notify you to reconnect. Once connectivity is restored, tap **Retry Connection** and tap **Save Draft**.

---

## 11. Project Demonstration Guide (Team Lead Presentation Script)

*Use this step-by-step presentation script when presenting WCM Outreach to your Team Lead or ministry board.*

---

### Step 1: Introduction (30 seconds)
> *"Good morning / afternoon. Today, I am excited to demonstrate **WCM Outreach**, our custom-built reporting and operations system for World Christian Ministry. 
> 
> In our ministry, field coordinators travel to various church venues every week. Previously, recording venue readiness, crowd attendance, and pastor feedback was done manually through messages and paper slips. WCM Outreach brings all of that into one secure, mobile-friendly platform."*

---

### Step 2: Show the Application Launch & Splash Screen (15 seconds)
*Open `http://localhost:3000/login` in the browser.*
> *"When any worker opens the platform, they are greeted by an official 4-second branded splash screen featuring our WCM emblem and progress animation, creating an immediate sense of trust and professionalism."*

---

### Step 3: Show the Sign In & Demo Selector (30 seconds)
*Show the login card and point out the Quick Demo buttons.*
> *"Our platform uses secure role-based authentication. To make testing and leadership review effortless, we built in 1-click demo selectors for our four key roles: Admin, Coordinator, State Leader, and Zone Leader. 
> 
> Let's start by clicking **Coordinator** and logging in."*

---

### Step 4: Demonstrate the Coordinator Workspace & 3-Step Report Builder (2 minutes)
*Click Coordinator demo button $\to$ tap Sign In $\to$ navigate to `/coordinator/dashboard`.*
> *"Here is the Coordinator Workspace. The coordinator sees administrative announcements and their existing reports with live status badges.
> 
> Now, let's tap **Create New Report** to see our unified 3-step report wizard.
> 
> * **Section 1: Verification Sheet**: Here, the coordinator verifies host pastor details, church readiness, stage, sound, and lodging before the service.
> * **Section 2: Attendance Record**: Here, the coordinator captures the exact count of attending members and visiting pastors.
> * **Section 3: After-Meeting Evaluation**: Here, the coordinator evaluates congregation response, lists future event opportunities like youth meetings, and provides their textual signature.
> 
> Notice that the coordinator can tap **Save Draft** at any time. Once all three tabs reach 100%, the **Submit Report** button activates, locking the report and forwarding it up the leadership chain."*

---

### Step 5: Demonstrate the Personnel Directory ("Find People") (1 minute)
*Tap **Find People** in the navigation bar.*
> *"Next is our **Personnel Directory**. Field coordinators often need to look up fellow workers or regional leaders. 
> 
> We can type any name or phone number into the live search bar, and matching cards appear instantly. Clicking a card opens their full profile, complete with direct phone call and email triggers. We even included a high-resolution photo viewer where workers can download official ministry portraits for event posters."*

---

### Step 6: Demonstrate Zone & State Leader Review & Analytics (1.5 minutes)
*Sign out $\to$ select **Zone Leader** demo $\to$ sign in.*
> *"Now let's switch to the **Zone Leader** view. 
> 
> As a Zone Leader, I can inspect reports submitted by coordinators in my territory. I can open any report, view the verification and attendee numbers, and either **Approve & Forward** it to headquarters or **Request Changes** with specific written feedback.
> 
> Furthermore, switching to our **Analytics** tab gives leaders instant visual charts: total meetings, total members reached, a location distribution pie chart, and a 12-month outreach trend chart."*

---

### Step 7: Demonstrate Mobile & Multi-Language Readiness (30 seconds)
*Switch language to Telugu (`TE`) or Hindi (`HI`), and toggle Dark/Light mode.*
> *"To support workers across diverse regions, the interface translates instantly into English, Hindi, and Telugu with a single tap. Furthermore, the entire system is touch-optimized for mobile phones and installable as a Progressive Web App."*

---

### Step 8: Closing Summary (30 seconds)
> *"In summary, WCM Outreach replaces fragmented paperwork with a fast, verifiable, and beautiful reporting pipeline. It saves hours of manual work, keeps our field teams connected, and provides leadership with the clear data needed to expand God's kingdom. 
> 
> Thank you, and I welcome any questions or feedback!"*

---

## 12. Feature Inventory and Completeness Checklist

| Feature Name | Primary Screen | Primary User Action | Verified Expected Outcome | Status |
| :--- | :--- | :--- | :--- | :---: |
| **4s Splash Screen** | App Launch | Launch / Refresh | 4-second animated brand intro with smooth fade-out | **Verified** |
| **Role-Based Sign In** | `/login` | Enter username & password | Authenticates and routes to assigned role dashboard | **Verified** |
| **1-Click Demo Selector** | `/login` | Click role badge | Autofills demo username & password for instant login | **Verified** |
| **Coordinator Dashboard** | `/coordinator/dashboard` | View reports & notices | Displays summary modules, notices, and reports list | **Verified** |
| **Create Report** | `/coordinator/dashboard` | Tap "Create New Report" | Initializes new report ID and opens 3-step wizard | **Verified** |
| **Verification Sheet** | `/coordinator/report/[id]`| Fill host & venue fields | Captures host details, venue readiness, and dates | **Verified** |
| **Attendance Record** | `/coordinator/report/[id]`| Fill attendance numbers | Captures member count and visiting pastor count | **Verified** |
| **After-Meeting Sheet** | `/coordinator/report/[id]`| Fill outcome evaluation | Captures response, future events, and signature | **Verified** |
| **Save Draft** | `/coordinator/report/[id]`| Click "Save Draft" | Saves current inputs to database without submitting | **Verified** |
| **Submit Report** | `/coordinator/report/[id]`| Click "Submit Report" | Locks report and advances status to `SUBMITTED` | **Verified** |
| **Meeting Proposal** | `/coordinator/confirmations`| Click "Request Confirmation"| Submits proposed venue & dates to administration | **Verified** |
| **Proposal Decisions** | `/admin/dashboard` | Approve / Reject proposal | Sets proposal status and sends admin feedback | **Verified** |
| **Find People Search** | `/find-people` | Type in search input | Filters directory cards in real time by name/phone | **Verified** |
| **Candidate Profile** | `/find-people` | Click member card | Displays contact info, jurisdiction, and report history | **Verified** |
| **Photo Viewer & Download**| `/find-people` | Click zoom on avatar | Full modal viewer with direct file download button | **Verified** |
| **Leader Report Review** | Leader Dashboards | View / Approve / Return | Advances status or returns report with written notes | **Verified** |
| **Send Announcements** | Admin / Zone Dashboard | Submit message form | Dispatches broadcast or direct user notifications | **Verified** |
| **Unread Notification Ping**| Top Navigation Bar | Click notification bell | Displays notification panel or mobile bottom sheet | **Verified** |
| **User Management** | `/admin/dashboard` | Create / Edit / Delete user| Provisions new coordinators with territory assignments | **Verified** |
| **Monthly Analytics** | Analytics Tab | Select Month & Year | Renders KPI cards, location pie chart, and trend bars | **Verified** |
| **Multilingual Toggle** | Top Navigation Bar | Select EN, HI, or TE | Translates all UI labels and buttons immediately | **Verified** |
| **Theme Switching** | Top Navigation Bar | Click Sun / Moon | Toggles smooth Dark Mode and Light Mode styling | **Verified** |
| **Profile Photo Upload** | `/profile` | Click camera badge | Uploads and updates personal avatar image | **Verified** |
| **Password Change** | `/profile` | Submit password form | Updates and encrypts new personal password | **Verified** |
| **Offline Screen** | `/offline.html` | Refresh without network | Displays branded offline fallback with retry button | **Verified** |

---

*End of Feature-Wise Documentation — World Christian Ministry (WCM)*
