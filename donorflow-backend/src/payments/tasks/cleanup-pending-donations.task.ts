import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CleanupPendingDonationsTask {
  private readonly logger = new Logger(CleanupPendingDonationsTask.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredPendingDonations() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await this.prisma.donation.updateMany({
      where: {
        status: 'PENDING',
        donatedAt: {
          lt: thirtyMinutesAgo,
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} expired pending donations`);
      
      // Also decrement campaign totals for expired donations
      const expiredDonations = await this.prisma.donation.findMany({
        where: {
          status: 'EXPIRED',
          donatedAt: {
            gte: thirtyMinutesAgo,
            lt: new Date(Date.now() - 29 * 60 * 1000), // Only the ones we just expired
          },
          campaignId: { not: null },
        },
      });

      for (const donation of expiredDonations) {
        if (donation.campaignId) {
          await this.prisma.campaign.update({
            where: { id: donation.campaignId },
            data: {
              currentAmount: {
                decrement: donation.amount,
              },
            },
          });
        }
      }
    }
  }
}