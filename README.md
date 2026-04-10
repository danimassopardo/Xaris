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

## Easy mode (Windows)

No fuss — just double-click and go:

1. Install **[Node.js 20+](https://nodejs.org/)** (one-time, free).
2. Download or clone this repo to your computer.
3. Open the `scripts` folder and double-click **`RUN_ME.bat`**.
   - It will install everything, set up the database, and start the app automatically.
4. Open **[http://localhost:3000](http://localhost:3000)** in your browser. That's it!

> To stop the app, close the terminal window that opened (or press `Ctrl+C` inside it).

---

## Getting Started (developer steps)

### 1. Install dependencies

```bash
npm install
```

### 2. Generate the Prisma client

```bash
npm run db:generate
```

### 3. Run database migrations

```bash
npm run db:migrate
```

### 4. Seed sample data (10 students, 26 assignments)

```bash
npm run seed
```

### 5. Start the development server

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

## Per-assignment Habit Tracking & Pedagogy Fields

### `completedAt`
An optional date-time field on every assignment that records the **real date** of completion:
- For **entregas** (deliveries / homework): the date the student actually submitted.
- For **exámenes** (exams) and other items: the date the exam was taken or the task was done.

It is separate from `dueDate` (the target/deadline date) so teachers can compare both and spot patterns of lateness or early delivery.

### `habitStatus`
An optional indicator per assignment that reflects whether the student is building the right habit for that particular task. Possible values:

| Value | Meaning |
|-------|---------|
| `NOT_YET` | Habit not yet observed / not applicable |
| `IN_PROGRESS` | Student is improving — habit is forming |
| `ACQUIRED` | Habit is consolidated for this type of task |

Editable directly from the assignment row (inline select) or from the Edit dialog.

### Assignment table in the student profile
The student profile page (`/students/[id]`) shows a table with one row per assignment and the following columns:

| Column | Description |
|--------|-------------|
| Examen/Entrega | Title, type badge (Tarea / Examen / Entrega / Otro), and overdue indicator |
| Asignatura | Subject code |
| Estado | Current status with quick "→ Tardía" action when overdue |
| Nota | Grade value |
| Fecha objetivo | `dueDate` — the planned deadline |
| Fecha real | `completedAt` — when it was actually done |
| Hábito | `habitStatus` inline select |
| Acciones | Mark done/submitted (✔), clone, edit, delete |

The **workload summary** card above the table shows at a glance: number of pending items, number of overdue items, next upcoming deadline, and total estimated effort in minutes.

### `effortMinutes`
Optional integer field estimating the number of minutes needed to complete the assignment. Used in the workload summary to give a total effort estimate for all non-final pending assignments.
