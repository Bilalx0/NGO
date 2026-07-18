import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PublicDonationDto } from './dto/public-donation.dto';

@Injectable()
export class DonationsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateReceiptNumber(): string {
    return `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
   }

  async createInternal(
    organizationId: number,
    userId: number,
    dto: CreateDonationDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    // Verify campaign belongs to this org (if provided)
    if (dto.campaignId) {
      const campaign = await this.prisma.campaign.findFirst({
        where: { id: dto.campaignId, organizationId },
      });
      if (!campaign) {
        throw new NotFoundException('Campaign not found or access denied');
      }
    }

    // Verify donor belongs to this org (if provided)
    if (dto.donorId) {
      const donor = await this.prisma.donor.findFirst({
        where: { id: dto.donorId, organizationId },
      });
      if (!donor) {
        throw new NotFoundException('Donor not found or access denied');
      }
    }

    const receiptNumber = this.generateReceiptNumber();
    const amountDecimal = new Prisma.Decimal(dto.amount);

    // ATOMIC TRANSACTION: Create donation AND update campaign total simultaneously
    return this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.create({
        data: {
          organizationId,
          campaignId: dto.campaignId || null,
          donorId: dto.donorId || null,
          amount: amountDecimal,
          currency: dto.currency || 'PKR',
          paymentMethod: dto.paymentMethod || null,
          paymentReference: dto.paymentReference || null,
          receiptNumber,
          notes: dto.notes || null,
          recordedById: userId,
        },
        include: {
          campaign: true,
          donor: true,
        },
      });

      // Auto-update campaign currentAmount if linked to a campaign
      if (dto.campaignId) {
        await tx.campaign.update({
          where: { id: dto.campaignId },
          data: {
            currentAmount: {
              increment: amountDecimal,
            },
          },
        });
      }

      return donation;
    });
  }

  async createPublic(dto: PublicDonationDto) {
    // 1. Find active campaign by slug
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        slug: dto.campaignSlug,
        status: CampaignStatus.Active,
        isActive: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Active campaign not found');
    }

    const amountDecimal = new Prisma.Decimal(dto.amount);
    const receiptNumber = this.generateReceiptNumber();

    // 2. ATOMIC TRANSACTION: Find/Create Donor + Create Donation + Update Campaign
    return this.prisma.$transaction(async (tx) => {
      // Find existing donor by email, or create a new one
      let donorId: number | null = null;
      if (dto.donorEmail) {
        const existingDonor = await tx.donor.findFirst({
          where: {
            organizationId: campaign.organizationId,
            email: dto.donorEmail,
          },
        });

        if (existingDonor) {
          donorId = existingDonor.id;
        } else {
          const newDonor = await tx.donor.create({
            data: {
              organizationId: campaign.organizationId,
              fullName: dto.donorName,
              email: dto.donorEmail,
              phone: dto.donorPhone || null,
              isActive: true,
            },
          });
          donorId = newDonor.id;
        }
      } else {
        // If no email, create an anonymous donor record
        const anonymousDonor = await tx.donor.create({
          data: {
            organizationId: campaign.organizationId,
            fullName: dto.donorName || 'Anonymous',
            phone: dto.donorPhone || null,
            isActive: true,
          },
        });
        donorId = anonymousDonor.id;
      }

      // Create the donation
      const donation = await tx.donation.create({
        data: {
          organizationId: campaign.organizationId,
          campaignId: campaign.id,
          donorId,
          amount: amountDecimal,
          currency: 'PKR',
          paymentMethod: dto.paymentMethod || null,
          paymentReference: dto.paymentReference || null,
          receiptNumber,
        },
      });

      // Update campaign total
      await tx.campaign.update({
        where: { id: campaign.id },
        data: {
          currentAmount: {
            increment: amountDecimal,
          },
        },
      });

      return {
        ...donation,
        campaignTitle: campaign.title,
        donorName: dto.donorName,
      };
    });
  }

  async findAll(organizationId: number, page: number, limit: number) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.donation.findMany({
        where: { organizationId },
        include: { campaign: true, donor: true, recordedBy: true },
        orderBy: { donatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donation.count({ where: { organizationId } }),
    ]);

    return { data, total, page, limit };
  }

  async getReceipt(organizationId: number, donationId: number) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const donation = await this.prisma.donation.findFirst({
      where: { id: donationId, organizationId },
      include: {
        campaign: true,
        donor: true,
        organization: true,
      },
    });

    if (!donation) {
      throw new NotFoundException('Donation receipt not found');
    }

    return donation;
  }
}