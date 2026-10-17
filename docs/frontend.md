# WCM Ministry Leader Reporting System

# Frontend Architecture Documentation (Version 1.0)

> **Version:** 1.0
> **Application Type:** Full Stack Web Application
> **Frontend Framework:** Next.js (App Router)
> **Language:** TypeScript
> **Styling:** Tailwind CSS
> **UI Components:** shadcn/ui
> **Database:** Neon PostgreSQL (Backend)

---

# 1. Frontend Objective

The frontend should provide a **simple, clean, modern, and responsive** interface for WCM ministry leaders to complete their reporting workflow.

The application should focus on:

* Fast navigation
* Easy form filling
* Clear hierarchy
* Minimal learning curve
* Secure authentication

The frontend **must not introduce additional fields or features** beyond the approved PRD.

---

# 2. Frontend Architecture

```text
Frontend (Next.js)
│
├── Authentication
│
├── Leader Dashboard
│      ├── Verification Sheet
│      ├── Attendance
│      └── After Meeting
│
├── Ministry Head Dashboard
│      └── View Reports
│
└── Admin Dashboard
       ├── Users
       └── Reports
```

---

# 3. Technology Stack

| Layer         | Technology              |
| ------------- | ----------------------- |
| Framework     | Next.js 15 (App Router) |
| Language      | TypeScript              |
| Styling       | Tailwind CSS            |
| Components    | shadcn/ui               |
| Icons         | Lucide React            |
| Forms         | React Hook Form         |
| Validation    | Zod                     |
| Notifications | Sonner                  |
| Theme         | next-themes             |

---

# 4. Folder Structure

```text
src/

 app/
 │
 ├── login/
 │
 ├── leader/
 │      ├── dashboard/
 │      ├── verification/
 │      ├── attendance/
 │      └── after-meeting/
 │
 ├── head/
 │      └── dashboard/
 │
 ├── admin/
 │      └── dashboard/
 │
 └── layout.tsx

components/

 ui/

 forms/

 dashboard/

 cards/

 sidebar/

 navbar/

 tables/

 badges/

 loading/

hooks/

lib/

types/

services/

constants/

styles/
```

---

# 5. Application Layout

```text
+--------------------------------------------+

Logo

---------------------------------------------

Sidebar

Dashboard

Verification

Attendance

After Meeting

Logout

---------------------------------------------

Main Content Area

---------------------------------------------

Footer

+--------------------------------------------+
```

---

# 6. Authentication UI

## Login Page

Components

* WCM Logo
* Username Input
* Password Input
* Login Button

No signup page.

No forgot password.

No social login.

---

# 7. Leader Dashboard

Dashboard contains only:

```text
Verification Sheet

Attendance

After Meeting
```

No charts.

No analytics.

No graphs.

No notifications.

---

# 8. Sidebar

Leader Sidebar

```text
Dashboard

Verification Sheet

Attendance

After Meeting

Logout
```

Head Sidebar

```text
Dashboard

Reports

Logout
```

Admin Sidebar

```text
Dashboard

Users

Reports

Logout
```

---

# 9. Navigation Flow

```text
Login

↓

Dashboard

↓

Verification

↓

Attendance

↓

After Meeting

↓

Submit
```

---

# 10. Verification Sheet UI

## Page Layout

```text
Header

↓

Progress Indicator

↓

Section 1

↓

Section 2

↓

Section 3

↓

Section 4

↓

Save Button
```

---

## Section Cards

Each section appears inside an individual card.

Example

```text
+--------------------------------+

Basic Details

-------------------------------

Fields

-------------------------------

+--------------------------------+
```

---

# 11. Attendance UI

Layout

```text
Attendance Card

Date

Location

Field Executer

Members Attended

Pastors Attended

Remarks

Save
```

---

# 12. After Meeting UI

Layout

```text
Meeting Result

↓

Future Ministry

↓

Influence Assessment

↓

Final Review

↓

Save
```

Each section displayed inside a separate card.

---

# 13. Form Components

Text Input

```text
┌────────────────────────────┐

Input

└────────────────────────────┘
```

---

Textarea

```text
┌────────────────────────────┐

Long Text

Long Text

Long Text

└────────────────────────────┘
```

---

Radio Group

```text
○ Yes

○ No
```

---

Checkbox Group

```text
☐ Future Meetings

☐ Leadership Training

☐ Literature Distribution

☐ Digital Message Promotion
```

---

Select (only if needed)

```text
▼ Select
```

---

Button

```text
[ Save ]

[ Submit ]
```

---

# 14. Page Structure

Every page

```text
Header

↓

Breadcrumb

↓

Title

↓

Description

↓

Content Card

↓

Buttons
```

---

# 15. Card Design

All sections use cards.

```text
+--------------------------------------+

Card Header

---------------------------------------

Card Body

---------------------------------------

Card Footer

+--------------------------------------+
```

---

# 16. Responsive Design

Desktop

Sidebar visible.

Tablet

Sidebar collapsible.

Mobile

Hamburger menu.

Forms become single-column.

---

# 17. Typography

Heading

24–30px

Sub Heading

18–22px

Body

14–16px

Labels

13–14px

---

# 18. Color Palette

Primary

Deep Blue

Secondary

White

Success

Green

Warning

Orange

Error

Red

Background

Light Gray

Text

Dark Gray

---

# 19. Button Styles

Primary

Filled

Secondary

Outlined

Danger

Red

Disabled

Gray

---

# 20. Form Validation

Every required field

Shows error message

Example

```text
Date is required.

Location is required.

Contact Number is required.
```

---

# 21. Loading States

Button

```text
Saving...
```

Page

Skeleton Loader

Table

Loading Rows

---

# 22. Empty States

Reports

```text
No Reports Found
```

Users

```text
No Users Found
```

---

# 23. Success States

Save

```text
Verification Saved Successfully
```

Attendance

```text
Attendance Saved Successfully
```

After Meeting

```text
After Meeting Saved Successfully
```

Submit

```text
Report Submitted Successfully
```

---

# 24. Error States

Network Error

```text
Something went wrong.
```

Validation Error

```text
Please fill all required fields.
```

Unauthorized

```text
You don't have permission.
```

---

# 25. Ministry Head Dashboard

Components

* Header
* Sidebar
* Reports Table
* Report Details View

Head users can only **view** reports.

No edit controls.

---

# 26. Admin Dashboard

Components

* Header
* Sidebar
* Users Table
* Reports Table

Admin can:

* Manage users
* View all reports

---

# 27. State Management

Use React Context (or Zustand if preferred) for:

* Auth state
* Logged-in user
* Sidebar state
* Theme state

Form state should be handled with **React Hook Form**.

---

# 28. Performance Guidelines

* Server Components by default.
* Client Components only where interaction is needed.
* Lazy load large components.
* Optimize form rendering.
* Minimize unnecessary re-renders.

---

# 29. Accessibility

* Proper form labels.
* Keyboard navigation.
* Visible focus states.
* Sufficient color contrast.
* ARIA labels for interactive elements.

---

# 30. Frontend Development Phases

### Phase 1

* Project setup
* Authentication UI
* Global layout
* Sidebar
* Navigation

### Phase 2

* Verification Sheet
* Attendance
* After Meeting

### Phase 3

* Leader Dashboard
* Ministry Head Dashboard
* Admin Dashboard

### Phase 4

* Form validation
* API integration
* Error handling
* Loading states
* Responsive testing

---

# 31. Final Frontend Modules

```text
Frontend

│

├── Authentication

│

├── Shared Layout

│

├── Sidebar

│

├── Navbar

│

├── Leader Dashboard

│      ├── Verification Sheet
│      ├── Attendance
│      └── After Meeting

│

├── Ministry Head Dashboard

│      └── Reports

│

└── Admin Dashboard

       ├── Users

       └── Reports
```

This frontend documentation is intentionally scoped to your Version 1.0 requirements. It covers only the interfaces needed for authentication, the three reporting features, and the Head/Admin dashboards, without adding extra business modules or fields beyond your specification.
