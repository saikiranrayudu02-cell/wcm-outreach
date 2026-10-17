# WCM Ministry Leader Reporting System

# Complete Text Wireframes (Version 1.0)

> **Based on**
>
> * ✅ PRD
> * ✅ App Flow
> * ✅ Frontend Documentation
> * ✅ Backend Schema
> * ✅ Tech Stack
> * ✅ Implementation Plan
>
> These are **text wireframes only** (no images) and contain **only** the features and fields you specified.

---

# 1. Login Page

```text
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                         WCM MINISTRY                               │
│                  Leader Reporting System                           │
│                                                                    │
│---------------------------------------------------------------     │
│                                                                    │
│ Username                                                           │
│ ┌────────────────────────────────────────────────────────────┐     │
│ │                                                            │     │
│ └────────────────────────────────────────────────────────────┘     │
│                                                                    │
│ Password                                                           │
│ ┌────────────────────────────────────────────────────────────┐     │
│ │                                                            │     │
│ └────────────────────────────────────────────────────────────┘     │
│                                                                    │
│              [ Login ]                                             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

# 2. Leader Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ WCM Ministry                                           Leader : John        │
├───────────────┬─────────────────────────────────────────────────────────────┤
│               │                                                             │
│ Dashboard     │                  Welcome Leader                             │
│               │                                                             │
│ Verification  │  ┌──────────────────────────────────────────────┐           │
│               │  │ Verification Sheet                           │           │
│ Attendance    │  │ Complete Before Meeting                      │           │
│               │  └──────────────────────────────────────────────┘           │
│ After Meeting │                                                             │
│               │  ┌──────────────────────────────────────────────┐           │
│ Logout        │  │ Attendance                                  │           │
│               │  │ Fill Attendance Details                     │           │
│               │  └──────────────────────────────────────────────┘           │
│               │                                                             │
│               │  ┌──────────────────────────────────────────────┐           │
│               │  │ After Meeting                               │           │
│               │  │ Complete After Meeting                      │           │
│               │  └──────────────────────────────────────────────┘           │
│               │                                                             │
└───────────────┴─────────────────────────────────────────────────────────────┘
```

---

# 3. Verification Sheet

## Section 1

```text
====================================================
Verification Sheet

Progress
[ Section 1 ] [ Section 2 ] [ Section 3 ] [ Section 4 ]

----------------------------------------------------

Basic Details

Convener Name
[________________________________________]

Church / Ministry Name
[________________________________________]

State / District / City
[________________________________________]

Contact Number
[________________________________________]

Meeting Dates
[________________________________________]

Number of Days
[________________________________________]

Expected Attendance
[________________________________________]

             [ Save & Continue ]
```

---

## Section 2

```text
====================================================

Ministry Background

Years of Ministry

[________________________]

Church Members

[________________________]

Workers / Leaders

[________________________]

            [ Previous ]

            [ Save & Continue ]
```

---

## Section 3

```text
====================================================

Connection With WCM

How did you know WCM?

( ) YouTube Messages

( ) WCM Books

( ) Friends / Relatives

( ) Church Leaders

( ) Social Media

( ) Other

Have you read WCM Books?

( ) Yes

( ) No

Previously attended Prophet Kiran Paul Garu Meeting?

( ) Yes

( ) No

         [ Previous ]

         [ Save & Continue ]
```

---

## Section 4

```text
====================================================

Meeting Arrangements

Meeting Hall / Stage

( ) Good

( ) Average

( ) Poor

------------------------------------

Sound System

( ) Good

( ) Average

( ) Poor

------------------------------------

Accommodation

( ) Arranged

( ) Not Arranged

------------------------------------

Volunteer Support

( ) Strong

( ) Moderate

( ) Weak

------------------------------------

        [ Previous ]

        [ Save ]
```

---

# 4. Attendance

```text
==================================================

Attendance

Date

[____________________________]

Location / Place

[____________________________]

Field Executer

[____________________________]

Members Attended

[____________________________]

Pastors Attended

[____________________________]

Remarks

+----------------------------------------+

|

|

|

+----------------------------------------+

          [ Save Attendance ]
```

---

# 5. After Meeting

## Section 5

```text
==================================================

Meeting Result

Overall Meeting Outcome

( ) Excellent

( ) Good

( ) Average

( ) Poor

-----------------------------------

Congregation Response

( ) Highly Encouraged

( ) Encouraged

( ) Neutral

( ) Not Interested

        [ Save & Continue ]
```

---

## Section 6

```text
==================================================

Future Ministry

Continue Fellowship?

( ) Yes

( ) No

-------------------------------------

Future Opportunities

[ ] Future Meetings

[ ] Leadership Training

[ ] Literature Distribution

[ ] Digital Message Promotion

        [ Previous ]

        [ Save & Continue ]
```

---

## Section 7

```text
==================================================

Ministry Influence

Local Church Influence

( ) Low

( ) Medium

( ) High

------------------------------

Network Of Pastors

( ) Low

( ) Medium

( ) High

------------------------------

      [ Previous ]

      [ Save & Continue ]
```

---

## Section 8

```text
==================================================

Final Review

Strengths Observed

+--------------------------------+

|

|

|

+--------------------------------+

------------------------------------

Challenges Observed

+--------------------------------+

|

|

|

+--------------------------------+

------------------------------------

Opportunity For WCM

+--------------------------------+

|

|

|

+--------------------------------+

Coordinator Name

[____________________________]

Designation

[____________________________]

Signature

[____________________________]

Date

[____________________________]

        [ Previous ]

        [ Submit Report ]
```

---

# 6. Ministry Head Dashboard

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ WCM Ministry Head Dashboard                                              │
├──────────────┬───────────────────────────────────────────────────────────┤
│ Dashboard    │                                                           │
│              │ Submitted Reports                                         │
│ Reports      │                                                           │
│              │ ┌─────────────────────────────────────────────────────┐   │
│ Logout       │ │ Leader Name     Date       Status      View         │   │
│              │ ├─────────────────────────────────────────────────────┤   │
│              │ │ Leader 1        01-07-26   Submitted   [ Open ]     │   │
│              │ │ Leader 2        05-07-26   Submitted   [ Open ]     │   │
│              │ │ Leader 3        07-07-26   Submitted   [ Open ]     │   │
│              │ └─────────────────────────────────────────────────────┘   │
└──────────────┴───────────────────────────────────────────────────────────┘
```

---

# 7. Report View Page (Head)

```text
==================================================

Leader Name

Date

Verification Sheet

----------------------------------

Attendance

----------------------------------

After Meeting

----------------------------------

         Read Only

```

---

# 8. Admin Dashboard

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Admin Dashboard                                                             │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ Dashboard    │                                                              │
│              │ System Overview                                              │
│ Users        │                                                              │
│              │ Total Users                                                  │
│ Reports      │                                                              │
│              │ Total Reports                                                │
│ Logout       │                                                              │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

---

# 9. User Management

```text
====================================================

Users

----------------------------------------------------

Username

Role

State

Part

Zone

Action

----------------------------------------------------

leader01

Leader

AP

Part-1

Zone-1

Edit

----------------------------------------------------

leader02

Leader

TS

Part-2

Zone-3

Edit

----------------------------------------------------

```

---

# 10. Admin Reports

```text
======================================================

All Submitted Reports

------------------------------------------------------

Leader

State

Part

Zone

Date

Status

Open

------------------------------------------------------

Leader-1

AP

Part-1

Zone-1

01/07/26

Submitted

[ View ]

------------------------------------------------------

Leader-2

TS

Part-2

Zone-3

02/07/26

Submitted

[ View ]

------------------------------------------------------

```

---

# 11. Complete User Flow

```text
LOGIN
   │
   ▼
Leader Dashboard
   │
   ├────────────► Verification Sheet
   │
   ├────────────► Attendance
   │
   ├────────────► After Meeting
   │
   ▼
Submit Report
   │
   ▼
Neon PostgreSQL
   │
   ├────────────► Ministry Head Dashboard
   │
   ▼
Admin Dashboard
```

---

## Total Screens (Version 1.0)

| Screen                          | Status |
| ------------------------------- | ------ |
| Login                           | ✅      |
| Leader Dashboard                | ✅      |
| Verification Sheet (4 Sections) | ✅      |
| Attendance                      | ✅      |
| After Meeting (4 Sections)      | ✅      |
| Ministry Head Dashboard         | ✅      |
| Report View                     | ✅      |
| Admin Dashboard                 | ✅      |
| User Management                 | ✅      |
| Reports Management              | ✅      |

These wireframes provide a complete text-based blueprint for your Version 1.0 application and align with the six documents you created: PRD, App Flow, Frontend Architecture, Backend Schema, Tech Stack, and Implementation Plan. They can be used directly as a reference for UI development before creating visual designs.
