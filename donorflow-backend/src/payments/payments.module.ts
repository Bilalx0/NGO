import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SafepayService } from './safepay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [PrismaModule, SettingsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, SafepayService],
  exports: [PaymentsService, SafepayService],
})
export class PaymentsModule {}
