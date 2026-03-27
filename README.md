# Xaris — SLAT: Student Lifecycle & Academic Tracker

A high-density, minimalist digital dashboard for teachers to track students, assignments, and grades — built with Next.js 16, Prisma (SQLite), and Tailwind CSS v4.

## Features

- **Dashboard Overview** — 4 stat cards, upcoming 7-day calendar of exams/assignments, "At-Risk" widget (students with >3 pending assignments)
- **Student Management** — Full CRUD (Create, Read, Update, Delete) for student profiles with Name, Student ID, Course, and Notes
- **Assignment Tracker** — Many-to-one relationship between students and assignments/exams. Fields: Status (Pending/Submitted/Graded), Grade Value, Due Date
- **Advanced Filtering** — Filter students by grade average (<70%), sort by name, urgency (pending tasks first), or grade
- **Subjects** — Assignments linked to subjects (Math, English, Biology, History, CS)

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI primitives (Dialog, Select, Separator, etc.)
- **Icons**: Lucide React
- **Database**: Prisma v7 + SQLite (via `better-sqlite3`)
- **ORM**: Prisma with migrations

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run database migrations

```bash
npx prisma migrate dev
```

### 3. Seed sample data (10 students, 26 assignments)

```bash
npm run seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Database Schema

```
Student       — id, name, studentId, course, notes
Subject       — id, name, code
Assignment    — id, title, type, status, gradeValue, dueDate, studentId, subjectId
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout with Sidebar
│   ├── students/
│   │   ├── page.tsx                # Students list
│   │   └── [id]/page.tsx           # Student profile
│   ├── assignments/
│   │   └── page.tsx                # Global assignments list
│   └── api/
│       ├── students/route.ts       # GET all, POST
│       ├── students/[id]/route.ts  # GET one, PUT, DELETE
│       ├── assignments/route.ts    # GET all, POST
│       ├── assignments/[id]/route.ts  # GET one, PUT, DELETE
│       └── subjects/route.ts       # GET all
├── components/
│   ├── ui/                         # Reusable UI primitives
│   ├── students/                   # StudentTable, Add/EditStudentDialog
│   ├── assignments/                # AssignmentTable, Add/EditAssignmentDialog
│   └── dashboard/                  # CalendarWidget, AtRiskWidget
└── lib/
    ├── prisma.ts                   # Prisma client singleton
    └── utils.ts                    # cn(), formatDate(), grade helpers

prisma/
├── schema.prisma                   # Database models
├── seed.ts                         # Sample data seed script
└── migrations/                     # SQL migration history
```
