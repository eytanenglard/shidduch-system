/*
  Warnings:

  - You are about to drop the column `firebaseUid` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isPhoneVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_firebaseUid_key";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firebaseUid",
DROP COLUMN "isPhoneVerified",
DROP COLUMN "phone";
