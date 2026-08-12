import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SafepayService } from './safepay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { CleanupPendingDonationsTask } from './tasks/cleanup-pending-donations.task'; 

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SafepayService, CleanupPendingDonationsTask],
  exports: [PaymentsService, SafepayService],
})
export class PaymentsModule {}
