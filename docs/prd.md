# Product Requirements Document (PRD)

## WCM Ministry Leader Reporting System (Version 1.0)

---

# 1. Project Overview

## Project Name

**WCM Ministry Leader Reporting System (WMLRS)**

## Version

**v1.0**

## Application Type

Full Stack Web Application

## Database

**Neon PostgreSQL**

## Objective

Develop a centralized web application for the **WCM Ministry** where ministry leaders can securely log in, fill ministry-related reports, and submit them to ministry heads.

The application's primary objective is **only** to digitize the existing manual reporting process.

> **Important Requirement**
>
> This application must contain **ONLY** the features specified in this PRD.
>
> No additional business fields, analytics fields, ministry fields, or reporting fields should be added.
>
> Every field must exactly match the user's requirements.

---

# 2. Problem Statement

Currently ministry reports are collected manually.

This creates problems like

* Difficult tracking
* Manual paperwork
* Missing reports
* No centralized system
* Difficult monitoring by ministry heads

The system should solve this by providing one centralized dashboard.

---

# 3. Goal

The application should allow leaders to

* Login
* Fill Verification Sheet
* Fill Attendance Sheet
* Fill After Meeting Sheet
* Submit reports

After submission

Ministry Heads should be able to

* View reports
* Monitor leader activity

Admin should be able to manage the entire system.

---

# 4. User Hierarchy

```
Admin

     │

State Head

     │

Part Head

     │

Zone Head

     │

Leader
```

Hierarchy is based on

```
India

↓

State

↓

Part

↓

Zone

↓

Leader
```

---

# 5. User Roles

## 1. Admin

Complete system management.

Permissions

* Manage users
* View all submitted reports
* Monitor ministry activity

---

## 2. Ministry Head

Permissions

* View reports submitted by leaders under them
* Monitor work progress

Cannot edit submitted reports.

---

## 3. Leader

Permissions

* Login
* Access dashboard
* Fill forms
* Submit reports

Cannot access other leaders' reports.

---

# 6. Authentication

Leaders must authenticate using

* Username
* Password

After successful login

Navigate to Leader Dashboard.

---

# 7. Dashboard

Dashboard contains **ONLY** three primary modules.

```
Verification Sheet

Attendance

After Meeting
```

No extra modules.

---

# 8. Core Feature 1

# Attendance

Purpose

Store meeting attendance information.

Fields

| Field            | Type      |
| ---------------- | --------- |
| Date             | Date      |
| Location / Place | Text      |
| Field Executer   | Text      |
| Members Attended | Number    |
| Pastors Attended | Number    |
| Remarks          | Long Text |

Requirements

* All fields mandatory.
* Leader fills data.
* Save.
* Submit.

No additional fields.

---

# 9. Core Feature 2

# Verification Sheet

Purpose

Meeting verification before meeting starts.

---

## Section 1

### Basic Details

Fields

Convener Name

Church / Ministry Name

State / District / City

Contact Number

Meeting Dates

Number of Days

Expected Attendance

---

## Section 2

### Ministry Background

Fields

Years of Ministry

Church Members

Workers / Leaders

---

## Section 3

### Connection with WCM Ministry

Question

How did you come to know about WCM?

Options

* YouTube Messages
* WCM Books
* Friends / Relatives
* Church Leaders
* Social Media
* Other

Question

Have you read WCM books?

Options

Yes

No

Question

Have you previously attended Prophet Kiran Paul Garu's meeting?

Options

Yes

No

---

## Section 4

### Meeting Arrangements

Meeting Hall / Stage

Options

* Good
* Average
* Poor

---

Sound System

Options

* Good
* Average
* Poor

---

Accommodation for Team

Options

* Arranged
* Not Arranged

---

Volunteer Support

Options

* Strong
* Moderate
* Weak

---

Requirements

All four sections belong to one Verification Sheet.

No additional questions.

No additional fields.

---

# 10. Core Feature 3

# After Meeting

Purpose

Capture ministry impact after meeting completion.

---

## Section 5

Meeting Result

Overall Meeting Outcome

Options

* Excellent
* Good
* Average
* Poor

---

Congregation Response

Options

* Highly Encouraged
* Encouraged
* Neutral
* Not Interested

---

## Section 6

Future Ministry Possibilities

Question

Are they willing to continue fellowship with WCM?

Options

Yes

No

Future Opportunities

Options

* Future Meetings
* Leadership Training
* Literature Distribution
* Digital Message Promotion

---

## Section 7

Ministry Influence Assessment

Local Church Influence

Options

* Low
* Medium
* High

Network of Pastors

Options

* Low
* Medium
* High

---

## Section 8

Final Review

Strengths Observed

Long Text

Challenges Observed

Long Text

Opportunity for WCM Ministry

Long Text

Submitted By

Coordinator / Leader Name

Designation

Signature

Date

---

Requirements

All four sections belong to one After Meeting report.

No additional fields.

No extra questions.

---

# 11. Report Submission Flow

Leader Login

↓

Verification Sheet

↓

Attendance

↓

After Meeting

↓

Submit

↓

Visible to Ministry Head

↓

Visible to Admin

---

# 12. Leader Workflow

```
Login

↓

Dashboard

↓

Verification Sheet

↓

Attendance

↓

After Meeting

↓

Submit Report
```

---

# 13. Ministry Head Workflow

```
Login

↓

Dashboard

↓

View Submitted Reports

↓

Open Report

↓

Review
```

No editing permission.

---

# 14. Admin Workflow

```
Login

↓

Dashboard

↓

View Leaders

↓

View Reports

↓

Monitor Activity
```

---

# 15. Business Rules

## Rule 1

Attendance must contain only the six fields defined in this PRD.

---

## Rule 2

Verification Sheet must contain only Sections 1–4 exactly as specified.

---

## Rule 3

After Meeting must contain only Sections 5–8 exactly as specified.

---

## Rule 4

No additional business questions.

---

## Rule 5

No automatic calculations.

---

## Rule 6

No additional reporting fields.

---

## Rule 7

Data should be stored exactly as entered.

---

## Rule 8

Reports cannot be edited by Ministry Head.

---

## Rule 9

Leaders cannot view reports submitted by other leaders.

---

## Rule 10

Admin can view every submitted report.

---

# 16. Database

Database

```
Neon PostgreSQL
```

Every submitted report must be stored permanently.

---

# 17. Functional Requirements

### Authentication

* Username Login
* Password Login

---

### Leader Dashboard

* Verification Sheet
* Attendance
* After Meeting

---

### Ministry Head Dashboard

* View Reports

---

### Admin Dashboard

* Manage Users
* View Reports

---

# 18. Non-Functional Requirements

Performance

* Fast page loading
* Optimized database queries

Security

* Secure authentication
* Role-based authorization

Scalability

* Support multiple states
* Support multiple parts
* Support multiple zones

Reliability

* Data persistence in Neon PostgreSQL
* Consistent report storage

---

# 19. Out of Scope (Version 1.0)

The following features are intentionally excluded from this version to match your exact requirements:

* Charts
* Analytics
* Graphs
* PDF Export
* Excel Export
* Notifications
* Comments
* Approval Workflow
* Report Editing by Heads
* Additional Ministry Fields
* Extra Dashboard Widgets
* Attendance Tracking Beyond the Specified Fields
* AI Features
* File Uploads
* Media Attachments
* Calendar Integration

---

# 20. Acceptance Criteria

The application will be considered complete when:

* Leaders can log in with a username and password.
* Leaders can access exactly three modules: **Verification Sheet**, **Attendance**, and **After Meeting**.
* Every field you listed is present with no omissions.
* No additional fields are added anywhere in the forms.
* Submitted reports are stored in **Neon PostgreSQL**.
* Ministry Heads can view reports submitted by leaders under their hierarchy.
* Admin can view all reports and manage users.
* Role-based access control works correctly.
* The system functions reliably as a centralized reporting platform for the WCM ministry.

This PRD follows your instruction exactly: it includes only the three core features and the fields you specified, without introducing any extra business fields or workflows.
