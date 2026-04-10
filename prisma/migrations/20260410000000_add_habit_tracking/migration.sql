-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "Assignment" ADD COLUMN "habitStatus" TEXT NOT NULL DEFAULT 'NOT_YET';
ALTER TABLE "Assignment" ADD COLUMN "effortMinutes" INTEGER;
