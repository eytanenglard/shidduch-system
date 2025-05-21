/*
  Warnings:

  - You are about to drop the column `address` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `hobbies` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `referenceName1` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `referenceName2` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `referencePhone1` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `referencePhone2` on the `Profile` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('MILITARY_COMBATANT', 'MILITARY_SUPPORT', 'MILITARY_OFFICER', 'MILITARY_INTELLIGENCE_CYBER_TECH', 'NATIONAL_SERVICE_ONE_YEAR', 'NATIONAL_SERVICE_TWO_YEARS', 'HESDER_YESHIVA', 'YESHIVA_ONLY_POST_HS', 'PRE_MILITARY_ACADEMY_AND_SERVICE', 'EXEMPTED', 'CIVILIAN_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "HeadCoveringType" AS ENUM ('FULL_COVERAGE', 'PARTIAL_COVERAGE', 'HAT_BERET', 'SCARF_ONLY_SOMETIMES', 'NONE');

-- CreateEnum
CREATE TYPE "KippahType" AS ENUM ('BLACK_VELVET', 'KNITTED_SMALL', 'KNITTED_LARGE', 'CLOTH', 'BRESLEV', 'NONE_AT_WORK_OR_CASUAL', 'NONE_USUALLY', 'OTHER');

-- DropForeignKey
ALTER TABLE "AvailabilityInquiry" DROP CONSTRAINT "AvailabilityInquiry_firstPartyId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilityInquiry" DROP CONSTRAINT "AvailabilityInquiry_matchmakerId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilityInquiry" DROP CONSTRAINT "AvailabilityInquiry_secondPartyId_fkey";

-- DropForeignKey
ALTER TABLE "DateFeedback" DROP CONSTRAINT "DateFeedback_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "DateFeedback" DROP CONSTRAINT "DateFeedback_partyId_fkey";

-- DropForeignKey
ALTER TABLE "DateFeedback" DROP CONSTRAINT "DateFeedback_suggestionId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_matchmakerId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_userId_fkey";

-- DropForeignKey
ALTER TABLE "Meeting" DROP CONSTRAINT "Meeting_suggestionId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionnaireResponse" DROP CONSTRAINT "QuestionnaireResponse_userId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestionInquiry" DROP CONSTRAINT "SuggestionInquiry_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "SuggestionInquiry" DROP CONSTRAINT "SuggestionInquiry_toUserId_fkey";

-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_userId_fkey";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "address",
DROP COLUMN "hobbies",
DROP COLUMN "referenceName1",
DROP COLUMN "referenceName2",
DROP COLUMN "referencePhone1",
DROP COLUMN "referencePhone2",
ADD COLUMN     "aliyaCountry" TEXT,
ADD COLUMN     "aliyaYear" INTEGER,
ADD COLUMN     "educationLevel" TEXT,
ADD COLUMN     "hasChildrenFromPrevious" BOOLEAN DEFAULT false,
ADD COLUMN     "headCovering" "HeadCoveringType",
ADD COLUMN     "kippahType" "KippahType",
ADD COLUMN     "profileCharacterTraits" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "profileHobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "serviceDetails" TEXT,
ADD COLUMN     "serviceType" "ServiceType",
ADD COLUMN     "shomerNegiah" BOOLEAN;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_firstPartyId_fkey" FOREIGN KEY ("firstPartyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_secondPartyId_fkey" FOREIGN KEY ("secondPartyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionInquiry" ADD CONSTRAINT "SuggestionInquiry_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionInquiry" ADD CONSTRAINT "SuggestionInquiry_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
