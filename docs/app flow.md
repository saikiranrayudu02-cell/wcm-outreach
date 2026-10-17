# WCM Ministry Leader Reporting System

# Application Flow Document (Version 1.0)

> **Note:** This application flow is based **100%** on your requirements. It contains **only** the three main features:
>
> * Verification Sheet
> * Attendance
> * After Meeting
>
> No extra modules, business logic, or fields have been added.

---

# 1. Overall Application Flow

```text
User Opens Application
          │
          ▼
      Login Page
          │
          ▼
 Username + Password
          │
          ▼
Authentication
          │
          ▼
Check User Role
          │
 ┌────────┴────────┐
 │                 │
 ▼                 ▼
Leader        Ministry Head/Admin
```

---

# 2. Complete System Hierarchy

```text
India
   │
   ▼
State
   │
   ▼
Part
   │
   ▼
Zone
   │
   ▼
Leader
```

Reports always move upward through this hierarchy.

```text
Leader
   │
   ▼
Zone Head
   │
   ▼
Part Head
   │
   ▼
State Head
   │
   ▼
Admin
```

---

# 3. Authentication Flow

```text
Open Website
      │
      ▼
Login Page
      │
      ▼
Enter Username
      │
      ▼
Enter Password
      │
      ▼
Click Login
      │
      ▼
Credentials Valid?
      │
 ┌────┴────┐
 │         │
No        Yes
 │         │
 ▼         ▼
Error   Dashboard
```

---

# 4. Leader Dashboard Flow

```text
Leader Dashboard
      │
      ├───────────────► Verification Sheet
      │
      ├───────────────► Attendance
      │
      │
      └───────────────► After Meeting
```

Only these three modules should appear on the Leader Dashboard.

---

# 5. Leader Complete Workflow

```text
Login
   │
   ▼
Dashboard
   │
   ▼
Verification Sheet
   │
   ▼
Save
   │
   ▼
Attendance
   │
   ▼
Save
   │
   ▼
After Meeting
   │
   ▼
Save
   │
   ▼
Submit Report
   │
   ▼
Stored in Neon Database
   │
   ▼
Visible to Ministry Head
   │
   ▼
Visible to Admin
```

---

# 6. Verification Sheet Flow

```text
Verification Sheet
        │
        ▼
Section 1
Basic Details
        │
        ▼
Section 2
Ministry Background
        │
        ▼
Section 3
Connection with WCM
        │
        ▼
Section 4
Meeting Arrangements
        │
        ▼
Save
```

---

# 7. Attendance Flow

```text
Attendance
      │
      ▼
Enter Date
      │
      ▼
Enter Location
      │
      ▼
Enter Field Executer
      │
      ▼
Enter Members Attended
      │
      ▼
Enter Pastors Attended
      │
      ▼
Enter Remarks
      │
      ▼
Save
```

---

# 8. After Meeting Flow

```text
After Meeting
      │
      ▼
Section 5
Meeting Result
      │
      ▼
Section 6
Future Ministry
      │
      ▼
Section 7
Influence Assessment
      │
      ▼
Section 8
Final Review
      │
      ▼
Save
```

---

# 9. Final Submission Flow

```text
Verification Completed?
         │
         ▼
Attendance Completed?
         │
         ▼
After Meeting Completed?
         │
         ▼
Submit Report
         │
         ▼
Store in Neon PostgreSQL
         │
         ▼
Submission Successful
```

---

# 10. Report Visibility Flow

```text
Leader
   │
   ▼
Submits Report
   │
   ▼
Database
   │
   ├────────────► Ministry Head
   │
   └────────────► Admin
```

Leaders cannot see reports submitted by other leaders.

---

# 11. Ministry Head Flow

```text
Login
   │
   ▼
Dashboard
   │
   ▼
View Leader Reports
   │
   ▼
Open Report
   │
   ▼
Read Verification Sheet
   │
   ▼
Read Attendance
   │
   ▼
Read After Meeting
```

No editing permissions.

---

# 12. Admin Flow

```text
Login
   │
   ▼
Admin Dashboard
   │
   ├────────────► Manage Users
   │
   ├────────────► View All Reports
   │
   └────────────► Monitor Ministry Activity
```

---

# 13. End-to-End User Journey

```text
Open Website
      │
      ▼
Login
      │
      ▼
Leader Dashboard
      │
      ▼
Verification Sheet
      │
      ▼
Attendance
      │
      ▼
After Meeting
      │
      ▼
Submit
      │
      ▼
Neon PostgreSQL Database
      │
      ├────────────► Ministry Head Dashboard
      │
      └────────────► Admin Dashboard
```

---

# 14. Application Navigation Map

```text
HOME
 │
 ▼
LOGIN
 │
 ▼
ROLE CHECK
 │
 ├───────────────────────────────┐
 │                               │
 ▼                               ▼
LEADER                     HEAD / ADMIN
 │                               │
 ▼                               ▼
Dashboard                   Dashboard
 │                               │
 ├───────────────┐               ├──────────────┐
 ▼               ▼               ▼              ▼
Verification   Attendance    View Reports   Manage Users
 │               │
 ▼               ▼
After Meeting
 │
 ▼
Submit Report
```

---

# 15. Data Flow Diagram (High Level)

```text
Leader
   │
   ▼
Verification Sheet
   │
   ▼
Attendance
   │
   ▼
After Meeting
   │
   ▼
Submit
   │
   ▼
Neon PostgreSQL
   │
   ├────────────► Ministry Head Dashboard
   │
   └────────────► Admin Dashboard
```

This application flow matches your current **Version 1.0** requirements exactly, with no additional features or fields beyond the ones you specified.
