# WCM Ministry Leader Reporting System

# Backend Database Schema Documentation (Version 1.0)

> **Database:** Neon PostgreSQL
> **ORM:** Prisma ORM
> **Architecture:** Relational Database
> **Version:** 1.0

---

# 1. Database Overview

The backend database is designed to support the WCM Ministry reporting workflow exactly as defined in the PRD.

The schema stores:

* User Authentication
* Ministry Hierarchy
* Verification Sheet
* Attendance Sheet
* After Meeting Sheet

No additional business tables or fields are included beyond the required functionality.

---

# 2. Entity Relationship Diagram (High Level)

```text
Users
   │
   │ 1
   │
   │ N
Reports
   │
   ├───────────────┐
   │               │
   ▼               ▼
Verification    Attendance
                     │
                     ▼
               After Meeting
```

---

# 3. Database Tables

The application requires only these tables:

```text
users

verification_sheets

attendance_records

after_meeting_reports
```

---

# 4. Table: users

Purpose

Stores all authenticated users.

### Columns

| Column        | Type         | Constraints                                     |
| ------------- | ------------ | ----------------------------------------------- |
| id            | UUID         | Primary Key                                     |
| username      | VARCHAR(100) | Unique                                          |
| password_hash | TEXT         | Required                                        |
| role          | ENUM         | ADMIN, STATE_HEAD, PART_HEAD, ZONE_HEAD, LEADER |
| state         | VARCHAR(100) | Nullable                                        |
| part          | VARCHAR(100) | Nullable                                        |
| zone          | VARCHAR(100) | Nullable                                        |
| created_at    | TIMESTAMP    | Default NOW()                                   |
| updated_at    | TIMESTAMP    | Auto Update                                     |

---

## Relationships

```text
One User

↓

Many Verification Sheets

↓

Many Attendance Records

↓

Many After Meeting Reports
```

---

# 5. Table: verification_sheets

Purpose

Stores the complete Verification Sheet (Sections 1–4).

### Columns

| Column    | Type                 |
| --------- | -------------------- |
| id        | UUID                 |
| leader_id | UUID (FK → users.id) |

### Section 1 - Basic Details

| Column               | Type    |
| -------------------- | ------- |
| convener_name        | TEXT    |
| church_ministry_name | TEXT    |
| state_district_city  | TEXT    |
| contact_number       | TEXT    |
| meeting_dates        | TEXT    |
| number_of_days       | INTEGER |
| expected_attendance  | INTEGER |

### Section 2 - Ministry Background

| Column            | Type    |
| ----------------- | ------- |
| years_of_ministry | INTEGER |
| church_members    | INTEGER |
| workers_leaders   | INTEGER |

### Section 3 - Connection with WCM

| Column                         | Type    |
| ------------------------------ | ------- |
| know_about_wcm                 | TEXT    |
| read_wcm_books                 | BOOLEAN |
| attended_prophet_kiran_meeting | BOOLEAN |

### Section 4 - Meeting Arrangements

| Column             | Type |
| ------------------ | ---- |
| meeting_hall_stage | TEXT |
| sound_system       | TEXT |
| accommodation_team | TEXT |
| volunteer_support  | TEXT |

### Metadata

| Column     | Type      |
| ---------- | --------- |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# 6. Table: attendance_records

Purpose

Stores attendance details.

### Columns

| Column           | Type      |
| ---------------- | --------- |
| id               | UUID      |
| leader_id        | UUID (FK) |
| date             | DATE      |
| location         | TEXT      |
| field_executer   | TEXT      |
| members_attended | INTEGER   |
| pastors_attended | INTEGER   |
| remarks          | TEXT      |
| created_at       | TIMESTAMP |
| updated_at       | TIMESTAMP |

---

# 7. Table: after_meeting_reports

Purpose

Stores the complete After Meeting report (Sections 5–8).

### Columns

| Column    | Type      |
| --------- | --------- |
| id        | UUID      |
| leader_id | UUID (FK) |

### Section 5 - Meeting Result

| Column                  | Type |
| ----------------------- | ---- |
| overall_meeting_outcome | TEXT |
| congregation_response   | TEXT |

### Section 6 - Future Ministry

| Column               | Type    |
| -------------------- | ------- |
| continue_fellowship  | BOOLEAN |
| future_opportunities | TEXT[]  |

### Section 7 - Ministry Influence

| Column                 | Type |
| ---------------------- | ---- |
| local_church_influence | TEXT |
| network_of_pastors     | TEXT |

### Section 8 - Final Review

| Column              | Type |
| ------------------- | ---- |
| strengths_observed  | TEXT |
| challenges_observed | TEXT |
| opportunity_for_wcm | TEXT |
| coordinator_name    | TEXT |
| designation         | TEXT |
| signature           | TEXT |
| submission_date     | DATE |

### Metadata

| Column     | Type      |
| ---------- | --------- |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# 8. Relationships

## Users → Verification Sheets

```text
User (1)

↓

Verification Sheets (Many)
```

Foreign Key

```text
verification_sheets.leader_id

↓

users.id
```

---

## Users → Attendance

```text
User (1)

↓

Attendance Records (Many)
```

Foreign Key

```text
attendance_records.leader_id

↓

users.id
```

---

## Users → After Meeting

```text
User (1)

↓

After Meeting Reports (Many)
```

Foreign Key

```text
after_meeting_reports.leader_id

↓

users.id
```

---

# 9. Suggested Enums

## UserRole

```text
ADMIN

STATE_HEAD

PART_HEAD

ZONE_HEAD

LEADER
```

---

## HallStatus

```text
GOOD

AVERAGE

POOR
```

---

## AccommodationStatus

```text
ARRANGED

NOT_ARRANGED
```

---

## VolunteerSupport

```text
STRONG

MODERATE

WEAK
```

---

## MeetingOutcome

```text
EXCELLENT

GOOD

AVERAGE

POOR
```

---

## CongregationResponse

```text
HIGHLY_ENCOURAGED

ENCOURAGED

NEUTRAL

NOT_INTERESTED
```

---

## InfluenceRating

```text
LOW

MEDIUM

HIGH
```

---

## WCMSource

```text
YOUTUBE_MESSAGES

WCM_BOOKS

FRIENDS_RELATIVES

CHURCH_LEADERS

SOCIAL_MEDIA

OTHER
```

---

## FutureOpportunity

```text
FUTURE_MEETINGS

LEADERSHIP_TRAINING

LITERATURE_DISTRIBUTION

DIGITAL_MESSAGE_PROMOTION
```

---

# 10. Indexing Strategy

Create indexes on frequently queried columns:

```text
users.username

users.role

users.state

users.part

users.zone

verification_sheets.leader_id

attendance_records.leader_id

attendance_records.date

after_meeting_reports.leader_id
```

---

# 11. Data Flow

```text
Leader Login
      │
      ▼
Create Verification Sheet
      │
      ▼
Save to verification_sheets
      │
      ▼
Create Attendance
      │
      ▼
Save to attendance_records
      │
      ▼
Create After Meeting Report
      │
      ▼
Save to after_meeting_reports
```

---

# 12. Security Rules

* Passwords must be stored as **hashed values** (never plain text).
* Every table uses UUID primary keys.
* Leaders can only access their own records.
* Heads can only read records of leaders within their assigned hierarchy.
* Admin has full access to all records.

---

# 13. Audit Fields

Every business table should include:

| Column     | Type      |
| ---------- | --------- |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

# 14. Future Scalability

Although Version 1.0 includes only the required reporting features, the schema is structured so that additional modules (such as analytics, approvals, exports, or notifications) can be added later without redesigning the existing tables.

This backend schema keeps your original fields intact while organizing them into a clean relational database suitable for **Neon PostgreSQL + Prisma ORM**.
