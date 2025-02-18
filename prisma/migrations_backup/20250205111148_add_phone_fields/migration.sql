/*
  Warnings:

  - You are about to drop the column `phone` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[firebaseUid]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SuggestionCategory" AS ENUM ('ACTIVE', 'PENDING', 'HISTORY');

-- AlterTable
ALTER TABLE "MatchSuggestion" ADD COLUMN     "category" "SuggestionCategory" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "phone";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firebaseUid" TEXT,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MatchSuggestion_category_idx" ON "MatchSuggestion"("category");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_firebaseUid_key" ON "User"("firebaseUid");
