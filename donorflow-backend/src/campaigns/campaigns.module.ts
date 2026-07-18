import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { PublicCampaignsController } from './public-campaigns.controller';

@Module({
  controllers: [CampaignsController, PublicCampaignsController],
  providers: [CampaignsService, PrismaService],
})
export class CampaignsModule {}
