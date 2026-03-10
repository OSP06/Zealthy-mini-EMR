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