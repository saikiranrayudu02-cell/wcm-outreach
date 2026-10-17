# WCM Ministry Leader Reporting System

# Technology Stack Documentation (Version 1.0)

**Project Type:** Enterprise Full Stack Web Application
**Architecture:** Modern Full Stack (Frontend + Backend + Database)
**Database:** Neon PostgreSQL

---

# 1. Technology Overview

The WCM Ministry Leader Reporting System will be built using a modern, scalable, and production-ready technology stack that supports secure authentication, role-based access, responsive dashboards, and reliable data storage.

---

# 2. Complete Tech Stack

| Layer                 | Technology              |
| --------------------- | ----------------------- |
| Frontend              | Next.js 15 (App Router) |
| Language              | TypeScript              |
| Styling               | Tailwind CSS v4         |
| UI Components         | shadcn/ui               |
| Icons                 | Lucide React            |
| Form Management       | React Hook Form         |
| Validation            | Zod                     |
| State Management      | Zustand                 |
| Notifications         | Sonner                  |
| Authentication        | Better Auth             |
| Backend API           | Next.js Route Handlers  |
| ORM                   | Prisma ORM              |
| Database              | Neon PostgreSQL         |
| Password Hashing      | bcrypt                  |
| Environment Variables | dotenv                  |
| Theme                 | next-themes             |
| Package Manager       | pnpm                    |
| Code Quality          | ESLint + Prettier       |
| Version Control       | Git                     |
| Repository            | GitHub                  |
| Deployment            | Vercel                  |

---

# 3. Frontend Stack

## Framework

### Next.js 15 (App Router)

Purpose

* Server Components
* Client Components
* Routing
* Layouts
* Loading UI
* Error UI
* Route Protection

---

## Language

### TypeScript

Purpose

* Type Safety
* Better Developer Experience
* Fewer Runtime Errors
* Strong IntelliSense

---

## Styling

### Tailwind CSS v4

Purpose

* Utility-first CSS
* Responsive Design
* Fast Development
* Easy Maintenance

---

## UI Library

### shadcn/ui

Purpose

* Professional Components
* Accessible UI
* Consistent Design System
* Customizable Components

Components used

* Button
* Card
* Input
* Textarea
* Checkbox
* Radio Group
* Table
* Badge
* Dialog
* Dropdown Menu
* Alert Dialog
* Skeleton
* Toast

---

## Icons

### Lucide React

Purpose

* Dashboard Icons
* Navigation Icons
* Status Icons
* Action Icons

---

# 4. Forms

## React Hook Form

Purpose

* High-performance forms
* Minimal re-renders
* Easy validation integration
* Clean state management

Used in

* Login
* Verification Sheet
* Attendance
* After Meeting

---

## Validation

### Zod

Purpose

* Schema Validation
* Form Validation
* API Validation
* Type-safe Validation

---

# 5. State Management

## Zustand

Purpose

Manage frontend application state such as:

* Logged-in user
* Authentication state
* Sidebar open/close
* Theme preference

Form state should remain inside React Hook Form.

---

# 6. Authentication

## Better Auth

Purpose

* Username & Password authentication
* Session management
* Role-based authorization
* Secure login

Supported roles

```text
ADMIN

STATE_HEAD

PART_HEAD

ZONE_HEAD

LEADER
```

---

# 7. Backend

## Next.js Route Handlers

Purpose

Build secure REST APIs for:

* Login
* User Management
* Verification Sheet
* Attendance
* After Meeting
* Report Retrieval

Benefits

* Same codebase as frontend
* Easy deployment
* Simple maintenance

---

# 8. Database

## Neon PostgreSQL

Purpose

Store:

* Users
* Verification Sheets
* Attendance Records
* After Meeting Reports

Benefits

* Managed PostgreSQL
* Automatic Backups
* Branching
* Serverless
* Scalable
* Reliable

---

# 9. ORM

## Prisma ORM

Purpose

* Database Schema
* Database Queries
* Type-safe Database Access
* Migrations

Benefits

* Excellent TypeScript support
* Easy relationships
* Better readability
* Safer queries

---

# 10. Password Security

## bcrypt

Purpose

* Hash passwords before storing them
* Compare login credentials securely
* Prevent plain-text password storage

---

# 11. Notifications

## Sonner

Purpose

Display toast notifications such as:

* Login Successful
* Report Saved
* Report Submitted
* Validation Errors
* Network Errors

---

# 12. Theme Support

## next-themes

Purpose

* Light Mode
* Dark Mode
* Theme persistence

---

# 13. Development Tools

## ESLint

Purpose

* Detect coding issues
* Enforce coding standards

---

## Prettier

Purpose

* Automatic code formatting
* Consistent style across the project

---

# 14. Version Control

## Git

Purpose

* Track changes
* Branch management
* Collaboration

---

## GitHub

Purpose

* Remote repository
* Source code backup
* Pull requests
* Version history

---

# 15. Deployment

## Vercel

Purpose

* Host Next.js application
* Automatic deployments
* Preview deployments
* Global CDN
* HTTPS by default

---

# 16. Recommended Project Structure

```text
project-root/

├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── store/
│   ├── types/
│   ├── constants/
│   └── styles/
│
├── prisma/
│
├── public/
│
├── middleware.ts
│
├── .env
│
├── package.json
│
└── tsconfig.json
```

---

# 17. API Communication Flow

```text
Browser
    │
    ▼
Next.js Frontend
    │
    ▼
Route Handler API
    │
    ▼
Prisma ORM
    │
    ▼
Neon PostgreSQL
```

---

# 18. Authentication Flow

```text
Login Page
      │
      ▼
Better Auth
      │
      ▼
Session Created
      │
      ▼
Role Validation
      │
      ▼
Dashboard
```

---

# 19. Data Submission Flow

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
Route Handler
     │
     ▼
Prisma ORM
     │
     ▼
Neon PostgreSQL
```

---

# 20. Technology Responsibilities

| Technology      | Responsibility            |
| --------------- | ------------------------- |
| Next.js         | Frontend UI + API Routes  |
| TypeScript      | Type Safety               |
| Tailwind CSS    | Styling                   |
| shadcn/ui       | UI Components             |
| React Hook Form | Form Handling             |
| Zod             | Validation                |
| Zustand         | Client State Management   |
| Better Auth     | Authentication & Sessions |
| Prisma ORM      | Database Access           |
| Neon PostgreSQL | Data Storage              |
| bcrypt          | Password Hashing          |
| Sonner          | Toast Notifications       |
| next-themes     | Theme Management          |
| ESLint          | Code Quality              |
| Prettier        | Code Formatting           |
| Git             | Version Control           |
| GitHub          | Source Code Repository    |
| Vercel          | Deployment                |

---

# 21. Version 1.0 Scope

This technology stack is intentionally limited to support the current project requirements:

* Username/password authentication
* Role-based dashboards
* Verification Sheet
* Attendance
* After Meeting
* Report viewing for Heads
* User and report management for Admin

No additional technologies are included for features outside the Version 1.0 scope, keeping the stack focused, maintainable, and aligned with your exact requirements.
