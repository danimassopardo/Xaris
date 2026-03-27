import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

const today = new Date();
function daysFromNow(n: number): Date {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  // Clean up existing data
  await prisma.assignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.subject.deleteMany();

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: "Mathematics", code: "MATH101" } }),
    prisma.subject.create({ data: { name: "English Literature", code: "ENGL102" } }),
    prisma.subject.create({ data: { name: "Biology", code: "BIO103" } }),
    prisma.subject.create({ data: { name: "History", code: "HIST104" } }),
    prisma.subject.create({ data: { name: "Computer Science", code: "CS105" } }),
  ]);

  // Create 10 students
  const studentData = [
    { name: "Alice Johnson",   studentId: "S001", course: "Science",    notes: "Strong in lab work, needs support in written reports." },
    { name: "Bob Martinez",    studentId: "S002", course: "Arts",       notes: "Creative thinker, sometimes misses deadlines." },
    { name: "Carol Williams",  studentId: "S003", course: "Science",    notes: "Excellent participation in class discussions." },
    { name: "David Lee",       studentId: "S004", course: "Humanities", notes: "Struggling with mathematics concepts." },
    { name: "Emma Davis",      studentId: "S005", course: "Science",    notes: "Top performer, potential scholarship candidate." },
    { name: "Frank Wilson",    studentId: "S006", course: "Arts",       notes: "Shows great improvement this semester." },
    { name: "Grace Anderson",  studentId: "S007", course: "Humanities", notes: "Needs additional tutoring for upcoming exams." },
    { name: "Henry Taylor",    studentId: "S008", course: "Science",    notes: "Attends all extra-curricular activities." },
    { name: "Isabella Brown",  studentId: "S009", course: "Arts",       notes: "Exceptional writing skills." },
    { name: "Jack Thompson",   studentId: "S010", course: "Humanities", notes: "At risk — 4 overdue pending assignments." },
  ];

  const students = await Promise.all(
    studentData.map((s) => prisma.student.create({ data: s }))
  );

  // Assignment definitions: [title, type, status, gradeValue, dueDaysFromNow, studentIndex, subjectIndex]
  type AssignmentDef = [string, string, string, number | null, number, number, number];
  const assignmentDefs: AssignmentDef[] = [
    // Alice (S001) — 2 assignments
    ["Algebra Quiz 1",          "EXAM",       "GRADED",    88,   -5,  0, 0],
    ["Essay: Macbeth Analysis", "ASSIGNMENT", "SUBMITTED", null, -2,  0, 1],

    // Bob (S002) — 3 assignments, 2 pending
    ["Watercolour Portfolio",   "ASSIGNMENT", "GRADED",    76,   -8,  1, 1],
    ["Art History Essay",       "ASSIGNMENT", "PENDING",   null,  3,  1, 3],
    ["Mid-term Art Exam",       "EXAM",       "PENDING",   null,  6,  1, 1],

    // Carol (S003) — 2 assignments
    ["Bio Lab Report",          "ASSIGNMENT", "GRADED",    95,   -3,  2, 2],
    ["Cell Biology Quiz",       "EXAM",       "SUBMITTED", null,  1,  2, 2],

    // David (S004) — 4 assignments, 3 pending (at-risk)
    ["History Essay Draft",     "ASSIGNMENT", "SUBMITTED", null,  0,  3, 3],
    ["Math Worksheet",          "ASSIGNMENT", "PENDING",   null,  2,  3, 0],
    ["History Mid-term",        "EXAM",       "PENDING",   null,  4,  3, 3],
    ["CS Fundamentals Quiz",    "EXAM",       "PENDING",   null,  7,  3, 4],

    // Emma (S005) — 2 assignments
    ["Physics Problem Set",     "ASSIGNMENT", "GRADED",    98,   -6,  4, 0],
    ["Biology Final Exam",      "EXAM",       "GRADED",    97,   -1,  4, 2],

    // Frank (S006) — 2 assignments
    ["Creative Writing",        "ASSIGNMENT", "GRADED",    82,  -10,  5, 1],
    ["Drama Performance",       "ASSIGNMENT", "SUBMITTED", null,  5,  5, 1],

    // Grace (S007) — 4 assignments, 4 pending (at-risk)
    ["History Term Paper",      "ASSIGNMENT", "PENDING",   null,  1,  6, 3],
    ["CS Project",              "ASSIGNMENT", "PENDING",   null,  3,  6, 4],
    ["Math Final",              "EXAM",       "PENDING",   null,  5,  6, 0],
    ["English Novel Review",    "ASSIGNMENT", "PENDING",   null,  6,  6, 1],

    // Henry (S008) — 1 assignment
    ["Science Fair Project",    "ASSIGNMENT", "SUBMITTED", null,  2,  7, 2],

    // Isabella (S009) — 1 assignment
    ["Short Story Submission",  "ASSIGNMENT", "GRADED",    91,   -4,  8, 1],

    // Jack (S010) — 5 pending (at-risk)
    ["History Essay",           "ASSIGNMENT", "PENDING",   null, -3,  9, 3],
    ["Math Quiz",               "EXAM",       "PENDING",   null, -1,  9, 0],
    ["CS Homework",             "ASSIGNMENT", "PENDING",   null,  2,  9, 4],
    ["English Comprehension",   "ASSIGNMENT", "PENDING",   null,  4,  9, 1],
    ["Biology Quiz",            "EXAM",       "PENDING",   null,  6,  9, 2],
  ];

  await Promise.all(
    assignmentDefs.map(([title, type, status, gradeValue, dueDays, sIdx, subIdx]) =>
      prisma.assignment.create({
        data: {
          title,
          type,
          status,
          gradeValue: gradeValue !== null ? gradeValue : undefined,
          dueDate: daysFromNow(dueDays),
          studentId: students[sIdx].id,
          subjectId: subjects[subIdx].id,
        },
      })
    )
  );

  console.log("✅ Seed complete:");
  console.log(`   ${subjects.length} subjects`);
  console.log(`   ${students.length} students`);
  console.log(`   ${assignmentDefs.length} assignments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
