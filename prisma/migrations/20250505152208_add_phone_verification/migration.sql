/*
  Warnings:

  - The values [PENDING] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PHONE] on the enum `VerificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('PENDING_PHONE_VERIFICATION', 'ACTIVE', 'INACTIVE', 'BLOCKED');
ALTER TABLE "User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING_PHONE_VERIFICATION';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationType_new" AS ENUM ('EMAIL', 'PHONE_WHATSAPP', 'DOCUMENT', 'REFERENCE', 'PASSWORD_RESET');
ALTER TABLE "Verification" ALTER COLUMN "type" TYPE "VerificationType_new" USING ("type"::text::"VerificationType_new");
ALTER TYPE "VerificationType" RENAME TO "VerificationType_old";
ALTER TYPE "VerificationType_new" RENAME TO "VerificationType";
DROP TYPE "VerificationType_old";
COMMIT;

-- DropIndex
DROP INDEX "Verification_userId_type_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_PHONE_VERIFICATION';

-- AlterTable
ALTER TABLE "UserImage" ALTER COLUMN "cloudinaryPublicId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "target" TEXT;

-- CreateIndex
CREATE INDEX "Verification_userId_type_status_idx" ON "Verification"("userId", "type", "status");

-- CreateIndex
CREATE INDEX "Verification_target_type_status_idx" ON "Verification"("target", "type", "status");
