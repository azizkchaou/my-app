-- CreateEnum
CREATE TYPE "CheckType" AS ENUM ('ISSUED', 'RECEIVED');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PENDING', 'CLEARED', 'BOUNCED');

-- CreateTable
CREATE TABLE "checks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CheckType" NOT NULL,
    "payeeOrPayer" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL,
    "status" "CheckStatus" NOT NULL DEFAULT 'PENDING',
    "linkedTransactionId" TEXT,
    "alerted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checks_linkedTransactionId_key" ON "checks"("linkedTransactionId");

-- CreateIndex
CREATE INDEX "checks_userId_idx" ON "checks"("userId");

-- CreateIndex
CREATE INDEX "checks_depositDate_idx" ON "checks"("depositDate");

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checks" ADD CONSTRAINT "checks_linkedTransactionId_fkey" FOREIGN KEY ("linkedTransactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
