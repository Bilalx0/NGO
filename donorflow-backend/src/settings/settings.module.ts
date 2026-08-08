import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../prisma/prisma.module'; // Assuming your Prisma module is here

@Module({
  imports: [PrismaModule], // Required so we can inject PrismaService into SettingsService
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService], // Exporting this allows other modules (like Donations) to read payment settings later
})
export class SettingsModule {}