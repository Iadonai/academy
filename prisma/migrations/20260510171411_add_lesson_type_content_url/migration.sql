-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'PDF', 'QUIZ');

-- AlterTable
ALTER TABLE "lessons" ADD COLUMN     "content_url" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "lesson_type" "LessonType" NOT NULL DEFAULT 'VIDEO',
ALTER COLUMN "youtube_url" SET DEFAULT '';
