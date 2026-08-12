-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('DONATION', 'ZAKAT', 'SADQAH', 'EMERGENCY_RELIEF', 'EDUCATION', 'HEALTHCARE', 'FOOD_DRIVE', 'OTHER');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "type" "CampaignType" NOT NULL DEFAULT 'DONATION';

-- CreateIndex
CREATE INDEX "Campaign_type_idx" ON "Campaign"("type");
