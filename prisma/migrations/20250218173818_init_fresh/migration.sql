-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CANDIDATE', 'MATCHMAKER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('INTRODUCTION', 'PERSONAL_STORY', 'OTHER');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'WHATSAPP', 'PHONE');

-- CreateEnum
CREATE TYPE "MatchSuggestionStatus" AS ENUM ('DRAFT', 'PENDING_FIRST_PARTY', 'FIRST_PARTY_APPROVED', 'FIRST_PARTY_DECLINED', 'PENDING_SECOND_PARTY', 'SECOND_PARTY_APPROVED', 'SECOND_PARTY_DECLINED', 'AWAITING_MATCHMAKER_APPROVAL', 'CONTACT_DETAILS_SHARED', 'AWAITING_FIRST_DATE_FEEDBACK', 'THINKING_AFTER_DATE', 'PROCEEDING_TO_SECOND_DATE', 'ENDED_AFTER_FIRST_DATE', 'MEETING_PENDING', 'MEETING_SCHEDULED', 'MATCH_APPROVED', 'MATCH_DECLINED', 'DATING', 'ENGAGED', 'MARRIED', 'EXPIRED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SuggestionCategory" AS ENUM ('ACTIVE', 'PENDING', 'HISTORY');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'DATING', 'ENGAGED', 'MARRIED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE', 'DOCUMENT', 'REFERENCE', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'ANSWERED', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "role" "UserRole" NOT NULL DEFAULT 'CANDIDATE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" "VerificationType" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "nativeLanguage" TEXT,
    "additionalLanguages" TEXT[],
    "height" INTEGER,
    "maritalStatus" TEXT,
    "occupation" TEXT,
    "education" TEXT,
    "address" TEXT,
    "city" TEXT,
    "origin" TEXT,
    "religiousLevel" TEXT,
    "about" TEXT,
    "hobbies" TEXT,
    "parentStatus" TEXT,
    "siblings" INTEGER,
    "position" INTEGER,
    "preferredAgeMin" INTEGER,
    "preferredAgeMax" INTEGER,
    "preferredHeightMin" INTEGER,
    "preferredHeightMax" INTEGER,
    "preferredReligiousLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredEducation" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredOccupations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactPreference" TEXT,
    "referenceName1" TEXT,
    "referencePhone1" TEXT,
    "referenceName2" TEXT,
    "referencePhone2" TEXT,
    "isProfileVisible" BOOLEAN NOT NULL DEFAULT true,
    "preferredMatchmakerGender" "Gender",
    "matchingNotes" TEXT,
    "verifiedBy" TEXT,
    "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE',
    "availabilityNote" TEXT,
    "availabilityUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActive" TIMESTAMP(3),

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "status" "MeetingStatus" NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchSuggestion" (
    "id" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "firstPartyId" TEXT NOT NULL,
    "secondPartyId" TEXT NOT NULL,
    "status" "MatchSuggestionStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "internalNotes" TEXT,
    "firstPartyNotes" TEXT,
    "secondPartyNotes" TEXT,
    "matchingReason" TEXT,
    "followUpNotes" TEXT,
    "responseDeadline" TIMESTAMP(3),
    "decisionDeadline" TIMESTAMP(3),
    "lastStatusChange" TIMESTAMP(3),
    "previousStatus" "MatchSuggestionStatus",
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstPartySent" TIMESTAMP(3),
    "firstPartyResponded" TIMESTAMP(3),
    "secondPartySent" TIMESTAMP(3),
    "secondPartyResponded" TIMESTAMP(3),
    "firstMeetingScheduled" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "category" "SuggestionCategory" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionStatusHistory" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "status" "MatchSuggestionStatus" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "VideoType" NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityInquiry" (
    "id" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "firstPartyId" TEXT NOT NULL,
    "secondPartyId" TEXT NOT NULL,
    "firstPartyResponse" BOOLEAN,
    "secondPartyResponse" BOOLEAN,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "valuesAnswers" JSONB,
    "personalityAnswers" JSONB,
    "relationshipAnswers" JSONB,
    "partnerAnswers" JSONB,
    "religionAnswers" JSONB,
    "valuesCompleted" BOOLEAN NOT NULL DEFAULT false,
    "personalityCompleted" BOOLEAN NOT NULL DEFAULT false,
    "relationshipCompleted" BOOLEAN NOT NULL DEFAULT false,
    "partnerCompleted" BOOLEAN NOT NULL DEFAULT false,
    "religionCompleted" BOOLEAN NOT NULL DEFAULT false,
    "worldsCompleted" TEXT[],
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastSaved" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "cloudinaryPublicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateFeedback" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingNumber" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextSteps" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestionInquiry" (
    "id" TEXT NOT NULL,
    "suggestionId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "SuggestionInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ReviewedSuggestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ApprovedSuggestions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_token_key" ON "Verification"("token");

-- CreateIndex
CREATE INDEX "Verification_userId_type_idx" ON "Verification"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Meeting_suggestionId_idx" ON "Meeting"("suggestionId");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "MatchSuggestion_category_idx" ON "MatchSuggestion"("category");

-- CreateIndex
CREATE INDEX "MatchSuggestion_matchmakerId_idx" ON "MatchSuggestion"("matchmakerId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_firstPartyId_idx" ON "MatchSuggestion"("firstPartyId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_secondPartyId_idx" ON "MatchSuggestion"("secondPartyId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_status_idx" ON "MatchSuggestion"("status");

-- CreateIndex
CREATE INDEX "MatchSuggestion_priority_idx" ON "MatchSuggestion"("priority");

-- CreateIndex
CREATE INDEX "MatchSuggestion_lastActivity_idx" ON "MatchSuggestion"("lastActivity");

-- CreateIndex
CREATE INDEX "SuggestionStatusHistory_suggestionId_idx" ON "SuggestionStatusHistory"("suggestionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_userId_key" ON "Invitation"("userId");

-- CreateIndex
CREATE INDEX "Invitation_matchmakerId_idx" ON "Invitation"("matchmakerId");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_status_idx" ON "Invitation"("status");

-- CreateIndex
CREATE INDEX "AvailabilityInquiry_matchmakerId_idx" ON "AvailabilityInquiry"("matchmakerId");

-- CreateIndex
CREATE INDEX "AvailabilityInquiry_firstPartyId_idx" ON "AvailabilityInquiry"("firstPartyId");

-- CreateIndex
CREATE INDEX "AvailabilityInquiry_secondPartyId_idx" ON "AvailabilityInquiry"("secondPartyId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_userId_idx" ON "QuestionnaireResponse"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_completed_idx" ON "QuestionnaireResponse"("completed");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_valuesCompleted_idx" ON "QuestionnaireResponse"("valuesCompleted");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_personalityCompleted_idx" ON "QuestionnaireResponse"("personalityCompleted");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_relationshipCompleted_idx" ON "QuestionnaireResponse"("relationshipCompleted");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_partnerCompleted_idx" ON "QuestionnaireResponse"("partnerCompleted");

-- CreateIndex
CREATE INDEX "QuestionnaireResponse_religionCompleted_idx" ON "QuestionnaireResponse"("religionCompleted");

-- CreateIndex
CREATE INDEX "UserImage_userId_idx" ON "UserImage"("userId");

-- CreateIndex
CREATE INDEX "DateFeedback_suggestionId_idx" ON "DateFeedback"("suggestionId");

-- CreateIndex
CREATE INDEX "DateFeedback_partyId_idx" ON "DateFeedback"("partyId");

-- CreateIndex
CREATE INDEX "DateFeedback_meetingId_idx" ON "DateFeedback"("meetingId");

-- CreateIndex
CREATE INDEX "SuggestionInquiry_suggestionId_idx" ON "SuggestionInquiry"("suggestionId");

-- CreateIndex
CREATE INDEX "SuggestionInquiry_fromUserId_idx" ON "SuggestionInquiry"("fromUserId");

-- CreateIndex
CREATE INDEX "SuggestionInquiry_toUserId_idx" ON "SuggestionInquiry"("toUserId");

-- CreateIndex
CREATE UNIQUE INDEX "_ReviewedSuggestions_AB_unique" ON "_ReviewedSuggestions"("A", "B");

-- CreateIndex
CREATE INDEX "_ReviewedSuggestions_B_index" ON "_ReviewedSuggestions"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ApprovedSuggestions_AB_unique" ON "_ApprovedSuggestions"("A", "B");

-- CreateIndex
CREATE INDEX "_ApprovedSuggestions_B_index" ON "_ApprovedSuggestions"("B");

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_firstPartyId_fkey" FOREIGN KEY ("firstPartyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_secondPartyId_fkey" FOREIGN KEY ("secondPartyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionStatusHistory" ADD CONSTRAINT "SuggestionStatusHistory_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_firstPartyId_fkey" FOREIGN KEY ("firstPartyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityInquiry" ADD CONSTRAINT "AvailabilityInquiry_secondPartyId_fkey" FOREIGN KEY ("secondPartyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserImage" ADD CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateFeedback" ADD CONSTRAINT "DateFeedback_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionInquiry" ADD CONSTRAINT "SuggestionInquiry_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionInquiry" ADD CONSTRAINT "SuggestionInquiry_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestionInquiry" ADD CONSTRAINT "SuggestionInquiry_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReviewedSuggestions" ADD CONSTRAINT "_ReviewedSuggestions_A_fkey" FOREIGN KEY ("A") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ReviewedSuggestions" ADD CONSTRAINT "_ReviewedSuggestions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedSuggestions" ADD CONSTRAINT "_ApprovedSuggestions_A_fkey" FOREIGN KEY ("A") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ApprovedSuggestions" ADD CONSTRAINT "_ApprovedSuggestions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
