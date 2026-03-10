# Zealthy Mini-EMR & Patient Portal

A full-stack healthcare application built with **Next.js 14**, **Prisma ORM**, **PostgreSQL** , and **iron-session** for auth. Submitted as part of the Zealthy Full Stack Engineering Exercise.

---
## Live Application

Deployed on Vercel.

- **Patient Portal:** https://zealthy-mini-emr-black.vercel.app  
- **Admin EMR:** https://zealthy-mini-emr-black.vercel.app/admin  

> For the purpose of this exercise, the Admin interface is accessible directly so reviewers can explore the application without needing an admin login.

---

## Features

The application is divided into two main areas:

### Admin EMR (`/admin`)

- Patient Registry with search
- Patient detail view and profile editing
- Appointment management (create, edit, delete, recurring)
- Prescription management
- New patient registration
- Conflict detection for appointments
- Confirmation modals for destructive actions
- Status updates for appointments and prescriptions
- Toast notifications for actions

### Patient Portal (`/portal`)

- Secure login using email and password
- Dashboard with upcoming alerts
- Appointment timeline with recurrence expansion
- Medication tracking and refill schedules
- Server-side route protection using middleware

---

## Application Navigation Guide (How to Open & Explore)

### 1. Open Admin Dashboard

Navigate to:

```
https://zealthy-mini-emr-black.vercel.app/admin
```

This opens the **Patient Registry** where you can:

- Search for patients
- View appointment and prescription counts
- Click a patient to view their details

---

### 2. Review Patient Details

Inside a patient page you can:

- View profile details
- Edit profile information
- Reset password
- Manage appointments
- Manage prescriptions

---

### 3. Manage Appointments (Admin)

You can:

- Create a new appointment
- Edit appointment details
- Delete appointments
- Create recurring appointments
- Detect time conflicts automatically

If another appointment exists within **30 minutes**, the system warns the admin.

---

### 4. Manage Prescriptions (Admin)

You can:

- Create prescriptions from seeded medications
- Edit dosage or refill schedule
- Delete prescriptions
- Update prescription status

Prescription statuses include:

- Active
- Paused
- Completed
- Discontinued

---

### 5. Patient Portal

Navigate to:

```
https://zealthy-mini-emr-black.vercel.app
```

Log in using seeded patient credentials.

Inside the portal patients can:

- View upcoming appointments
- See refill reminders
- Track medication schedules
- View alerts for upcoming medical actions

---
## Sample Credentials

Use the following accounts to log into the **Patient Portal**.

| Patient | Email | Password |
|---|---|---|
| Mark Johnson | mark@some-email-provider.net | Password123! |
| Lisa Smith | lisa@some-email-provider.net | Password123! |

The **Admin EMR** is accessible directly at:

```
/admin
```

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

**Prisma**: Zero infrastructure for local dev. Switching to PostgreSQL is a one-line change in schema.prisma — no application code changes needed.

**iron-session**: Stores session data in a signed, encrypted cookie. No Redis or DB table needed. Stateless, works in Vercel's serverless environment.

**Middleware for route protection**: middleware.ts runs at the Edge before the page renders. Unauthenticated users are redirected away from /portal/* before any React code executes, eliminating the loading flash that client-side guards cause.

**Optimistic UI for deletes**: The row disappears from the UI instantly before the API call resolves. If the call fails, data is re-fetched and the row reappears. Makes the interface feel significantly more responsive.

**Recurring occurrence expansion**: Recurring appointments and refills are stored as a single DB record (start date + schedule + optional end date). The frontend expands all occurrences within a date window using a while-loop iterator. This avoids pre-generating and storing dozens of rows in the database.

**Conflict detection**: When scheduling, the datetime input checks against all existing appointments in real time. A warning appears if the new time is within 30 minutes of any existing appointment for that patient.

**Toast notifications**: A context-based ToastProvider wraps the entire app. Any component calls useToast().showToast(message, type) to surface feedback. Toasts auto-dismiss after 3.5 seconds and stack in the bottom-right corner.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | SQLite (local) — easily swappable to PostgreSQL |
| ORM | Prisma |
| Auth | iron-session (signed & encrypted cookies) |
| Password hashing | bcryptjs |
| Date handling | date-fns |
| Styling | Tailwind CSS |
| Deployment | Vercel |

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
