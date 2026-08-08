-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('Draft', 'Active', 'Completed');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "presetAmounts" TEXT,
ADD COLUMN     "status" "CampaignStatus" NOT NULL DEFAULT 'Draft';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "description" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT NOT NULL DEFAULT '#0F172A',
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "secondaryColor" TEXT NOT NULL DEFAULT '#2563EB',
ADD COLUMN     "taxExemption" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "websiteUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetExpiry" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- CreateTable
CREATE TABLE "PaymentConfig" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "merchantId" TEXT,
    "apiKey" TEXT,
    "isLiveMode" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" INTEGER NOT NULL,

    CONSTRAINT "PaymentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "organizationId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentConfig_organizationId_provider_key" ON "PaymentConfig"("organizationId", "provider");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- AddForeignKey
ALTER TABLE "PaymentConfig" ADD CONSTRAINT "PaymentConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
