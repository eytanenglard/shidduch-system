-- CreateEnum
CREATE TYPE "UserSource" AS ENUM ('REGISTRATION', 'MANUAL_ENTRY', 'IMPORTED');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "manualEntryText" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "addedByMatchmakerId" TEXT,
ADD COLUMN     "source" "UserSource" NOT NULL DEFAULT 'REGISTRATION';

-- CreateIndex
CREATE INDEX "User_source_idx" ON "User"("source");

-- CreateIndex
CREATE INDEX "User_addedByMatchmakerId_idx" ON "User"("addedByMatchmakerId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_addedByMatchmakerId_fkey" FOREIGN KEY ("addedByMatchmakerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
