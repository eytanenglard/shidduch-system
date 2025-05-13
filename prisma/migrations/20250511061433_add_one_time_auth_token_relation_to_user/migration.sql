-- DropIndex
DROP INDEX "Verification_token_key";

-- CreateTable
CREATE TABLE "OneTimeAuthToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OneTimeAuthToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OneTimeAuthToken_token_key" ON "OneTimeAuthToken"("token");

-- CreateIndex
CREATE INDEX "OneTimeAuthToken_userId_idx" ON "OneTimeAuthToken"("userId");

-- CreateIndex
CREATE INDEX "Verification_token_type_status_idx" ON "Verification"("token", "type", "status");

-- AddForeignKey
ALTER TABLE "OneTimeAuthToken" ADD CONSTRAINT "OneTimeAuthToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
