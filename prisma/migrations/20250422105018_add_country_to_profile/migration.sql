-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isProfileComplete" BOOLEAN NOT NULL DEFAULT false;
