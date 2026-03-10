# Zealthy Mini-EMR & Patient Portal

A full-stack healthcare application built with **Next.js 14**, **Prisma ORM**, **SQLite** (swappable to PostgreSQL), and **iron-session** for auth. Submitted as part of the Zealthy Full Stack Engineering Exercise.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Features](#features)
4. [Local Setup](#local-setup)
5. [Deploying to Vercel](#deploying-to-vercel)
6. [Deploying to Railway / Render / Fly.io](#deploying-to-railway--render--flyio)
7. [Environment Variables](#environment-variables)
8. [API Reference](#api-reference)
9. [Sample Credentials](#sample-credentials)
10. [Design Decisions](#design-decisions)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite (local) / PostgreSQL (production) |
| ORM | Prisma 5 |
| Auth | iron-session (signed, encrypted cookies) |
| Password hashing | bcryptjs |
| Date handling | date-fns |
| Styling | Tailwind CSS + custom CSS design tokens |

---

## Features

### Section 1 — Admin EMR (/admin)

- **Patient Registry**: table showing all patients with appointment count, prescription count, enrollment date. Searchable by name or email.
- **Patient Detail** (/admin/patients/:id):
  - View full profile: name, email, DOB, phone, address
  - Edit patient info via modal (including password reset)
  - Tabbed view: Appointments | Prescriptions
- **Appointments CRUD**:
  - Schedule new appointments: provider (free text), datetime, repeat schedule, optional end date
  - Edit and delete appointments
  - Optimistic UI: row fades out instantly on delete, reverts if server returns an error
  - Conflict detection: warns if a new appointment is within 30 minutes of an existing one
  - End recurring appointments via the end date field
- **Prescriptions CRUD**:
  - Prescribe from seeded medications and dosages dropdowns
  - Set quantity, next refill date, and refill schedule (weekly / monthly / quarterly)
  - Edit and delete with optimistic UI
- **New Patient Form**: name, email, password (plaintext for testing per spec), DOB, phone, address
- **Toast Notifications**: every create/update/delete triggers a success, info, or error toast

### Section 2 — Patient Portal (/)

- **Login Page**: email + password. Unauthenticated users accessing /portal/* are redirected instantly by middleware.ts before the page renders (no flash).
- **Dashboard** (/portal):
  - Amber alert banner if any appointments or refills fall within the next 7 days
  - Stats: total appointments, active prescriptions, urgent items this week
  - Appointment preview cards with next computed occurrence
  - Medication preview cards with next refill date
  - Patient info section
- **Appointments Page** (/portal/appointments):
  - Recurring appointments expanded out for the next 3 months
  - Sorted chronologically with "Today" / "Tomorrow" / "Xd" countdown
  - Amber highlight for appointments within 7 days
- **Medications Page** (/portal/medications):
  - All prescriptions with next refill date and countdown
  - Each card expands to show the full refill schedule for the next 3 months
  - Amber highlight for refills due within 7 days

---

## Project Structure

```
zealthy-emr/
├── app/
│   ├── page.tsx                          # Patient Portal login (route: /)
│   ├── layout.tsx                        # Root layout with ToastProvider
│   ├── globals.css                       # Design system: tokens, components, animations
│   │
│   ├── portal/                           # Patient Portal (auth-protected)
│   │   ├── layout.tsx                    # Sidebar nav + session guard
│   │   ├── page.tsx                      # Dashboard: 7-day summary
│   │   ├── appointments/page.tsx         # Full 3-month appointment schedule
│   │   └── medications/page.tsx          # All prescriptions + refill calendar
│   │
│   ├── admin/                            # EMR (no auth required)
│   │   ├── layout.tsx                    # Dark sidebar nav
│   │   ├── page.tsx                      # Patient registry table
│   │   ├── new-patient/page.tsx          # Create new patient
│   │   └── patients/[id]/page.tsx        # Patient detail: full CRUD
│   │
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts            # POST /api/auth/login
│       │   ├── logout/route.ts           # POST /api/auth/logout
│       │   └── me/route.ts               # GET /api/auth/me
│       └── patients/
│           ├── route.ts                  # GET (list) / POST (create)
│           └── [id]/
│               ├── route.ts              # GET (detail) / PUT (update)
│               ├── appointments/
│               │   ├── route.ts          # GET / POST
│               │   └── [apptId]/route.ts # PUT / DELETE
│               └── prescriptions/
│                   ├── route.ts          # GET / POST
│                   └── [rxId]/route.ts   # PUT / DELETE
│
├── components/
│   └── ToastProvider.tsx                 # Global toast notification system
│
├── lib/
│   ├── constants.ts                      # Medications, dosages, repeat options
│   ├── dateUtils.ts                      # Recurring occurrence helpers
│   ├── prisma.ts                         # Prisma client singleton
│   └── session.ts                        # iron-session config + types
│
├── middleware.ts                         # Server-side route protection for /portal/*
│
├── prisma/
│   ├── schema.prisma                     # DB schema: User, Appointment, Prescription
│   └── seed.ts                           # Seeds 2 sample patients with data
│
├── .env                                  # Local env (SQLite, session secret)
├── vercel.json                           # Vercel deployment config
└── README.md
```
---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| DATABASE_URL | YES | PostgreSQL: postgresql://... |
| SESSION_SECRET | YES | Min 32-char random string for encrypting cookies |

For local dev, both are already set in .env. For production, set them in your platform's dashboard. Never commit .env to git with real secrets.

---

## API Reference

### Auth

| Method | Path | Body | Description |
|---|---|---|---|
| POST | /api/auth/login | { email, password } | Login; sets encrypted session cookie |
| POST | /api/auth/logout | - | Destroys session cookie |
| GET | /api/auth/me | - | Returns { user } or { user: null } |

### Patients

| Method | Path | Body | Description |
|---|---|---|---|
| GET | /api/patients | - | List all patients |
| POST | /api/patients | { name, email, password, phone?, dob?, address? } | Create patient |
| GET | /api/patients/:id | - | Get with appointments + prescriptions |
| PUT | /api/patients/:id | { name, email, phone?, ... } | Update patient |

### Appointments

| Method | Path | Body | Description |
|---|---|---|---|
| GET | /api/patients/:id/appointments | - | List appointments |
| POST | /api/patients/:id/appointments | { provider, datetime, repeat, endDate? } | Create |
| PUT | /api/patients/:id/appointments/:apptId | same | Update |
| DELETE | /api/patients/:id/appointments/:apptId | - | Delete |

repeat values: none, daily, weekly, monthly

### Prescriptions

| Method | Path | Body | Description |
|---|---|---|---|
| GET | /api/patients/:id/prescriptions | - | List prescriptions |
| POST | /api/patients/:id/prescriptions | { medication, dosage, quantity, refillOn, refillSchedule } | Create |
| PUT | /api/patients/:id/prescriptions/:rxId | same | Update |
| DELETE | /api/patients/:id/prescriptions/:rxId | - | Delete |

refillSchedule values: weekly, monthly, quarterly

---

## Sample Credentials

Seeded automatically when you run prisma/seed.ts:

| Patient | Email | Password |
|---|---|---|
| Mark Johnson | mark@some-email-provider.net | Password123! |
| Lisa Smith | lisa@some-email-provider.net | Password123! |

New patients created via /admin/new-patient can immediately log in to the Portal.

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create the SQLite database and push schema
npx prisma db push

# 4. Seed sample data
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 5. Start dev server
npm run dev
```

Visit http://localhost:3000

One-liner shortcut (steps 3-5 combined):
```bash
npm run setup && npm run dev
```
---

## Design Decisions

**SQLite + Prisma**: Zero infrastructure for local dev. Switching to PostgreSQL is a one-line change in schema.prisma — no application code changes needed.

**iron-session**: Stores session data in a signed, encrypted cookie. No Redis or DB table needed. Stateless, works in Vercel's serverless environment.

**Middleware for route protection**: middleware.ts runs at the Edge before the page renders. Unauthenticated users are redirected away from /portal/* before any React code executes, eliminating the loading flash that client-side guards cause.

**Optimistic UI for deletes**: The row disappears from the UI instantly before the API call resolves. If the call fails, data is re-fetched and the row reappears. Makes the interface feel significantly more responsive.

**Recurring occurrence expansion**: Recurring appointments and refills are stored as a single DB record (start date + schedule + optional end date). The frontend expands all occurrences within a date window using a while-loop iterator. This avoids pre-generating and storing dozens of rows in the database.

**Conflict detection**: When scheduling, the datetime input checks against all existing appointments in real time. A warning appears if the new time is within 30 minutes of any existing appointment for that patient.

**Toast notifications**: A context-based ToastProvider wraps the entire app. Any component calls useToast().showToast(message, type) to surface feedback. Toasts auto-dismiss after 3.5 seconds and stack in the bottom-right corner.

---
## Future Enhancements

### 1. AI Scribe — Appointment Notes with Patient-Visible Summary

**What it is**: When a provider finishes an appointment, they dictate or type raw clinical notes directly in the admin EMR. An AI (Claude API / GPT-4) rewrites those notes into a clean, plain-English summary that the patient can read in their portal.

**How it would work**:

1. Add a `rawNotes` (provider-only) and `patientSummary` (patient-visible) field to the `Appointment` model in `schema.prisma`
2. On the admin patient detail page, add a "Add Appointment Notes" modal with a textarea for the provider's raw notes
3. On save, send the raw notes to a new API route `/api/appointments/:id/summarize` which calls the Claude API:
   ```
   System: You are a medical scribe. Rewrite the following clinical notes into a clear, friendly, 2-3 sentence plain-English summary that a patient can understand. Avoid jargon.
   User: [raw provider notes]
   ```
4. Store both `rawNotes` (never shown to patient) and `patientSummary` (shown in portal) in the DB
5. In the Patient Portal's Medical History page, show the AI-generated summary under each completed appointment card

**Schema addition needed**:
```prisma
model Appointment {
  // ...existing fields
  rawNotes       String?   // provider-only, never exposed to patient
  patientSummary String?   // AI-generated plain English, shown in portal
}
```

**Why it matters**: Closes the information gap between what the provider records and what the patient actually understands about their visit. Zero extra work for the provider — they write notes they'd write anyway.

---

### 2. Admin Patient History Summary Dashboard

**What it is**: A dedicated analytics panel on the admin side for each patient — a single-page view giving the provider a bird's-eye overview of the patient's full medical history without having to scroll through individual records.

**What it would show**:

- **Medication timeline**: a horizontal bar chart (one row per medication) showing when each course started, ended, or was discontinued — with dosage labeled on each bar
- **Appointment frequency chart**: a month-by-month bar chart of appointment volume over the past 12 months
- **Prescription history table**: grouped by medication name, showing all historical courses sorted oldest-to-newest with dosage changes highlighted (same diff logic as patient history page)
- **Key metrics strip**: total appointments attended vs cancelled (attendance rate), number of unique medications over time, longest-running active prescription, months as a patient
- **Alerts panel**: overdue refills, no appointments in the past 90 days, same medication at escalating doses (potential flag)