import { ForbiddenException, Injectable } from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignReportDto } from './dto/campaign-report.dto';
import { DonationReportDto } from './dto/donation-report.dto';
import { DonorReportDto } from './dto/donor-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(organizationId: number) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const [
      totalRaised,
      totalDonors,
      activeCampaigns,
      recentDonations,
      monthlyDonations,
    ] = await Promise.all([
      // Total funds raised (all time)
      this.prisma.donation.aggregate({
        where: { organizationId },
        _sum: { amount: true },
      }),

      // Total unique donors
      this.prisma.donor.count({
        where: { organizationId, isActive: true },
      }),

      // Active campaigns count
      this.prisma.campaign.count({
        where: { organizationId, status: CampaignStatus.Active, isActive: true },
      }),

      // Recent donations (last 5)
      this.prisma.donation.findMany({
        where: { organizationId },
        include: { donor: true, campaign: true },
        orderBy: { donatedAt: 'desc' },
        take: 5,
      }),

      // Donations this month
      this.prisma.donation.aggregate({
        where: {
          organizationId,
          donatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRaised: totalRaised._sum.amount?.toNumber() || 0,
      totalDonors,
      activeCampaigns,
      recentDonations: recentDonations.map((d) => ({
        id: d.id,
        amount: d.amount.toNumber(),
        donorName: d.donor?.fullName || 'Anonymous',
        campaignTitle: d.campaign?.title || 'General',
        donatedAt: d.donatedAt,
      })),
      monthlyRaised: monthlyDonations._sum.amount?.toNumber() || 0,
    };
  }

  async getDonationReport(organizationId: number, filters: DonationReportDto) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const where: Prisma.DonationWhereInput = {
      organizationId,
      ...(filters.startDate || filters.endDate
        ? {
            donatedAt: {
              ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
              ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
            },
          }
        : {}),
      ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
    };

    const donations = await this.prisma.donation.findMany({
      where,
      include: { donor: true, campaign: true, recordedBy: true },
      orderBy: { donatedAt: 'desc' },
    });

    const totalAmount = donations.reduce(
      (sum, d) => sum + d.amount.toNumber(),
      0,
    );

    return {
      data: donations.map((d) => ({
        id: d.id,
        amount: d.amount.toNumber(),
        currency: d.currency,
        donorName: d.donor?.fullName || 'Anonymous',
        donorEmail: d.donor?.email,
        campaignTitle: d.campaign?.title || 'General',
        paymentMethod: d.paymentMethod,
        receiptNumber: d.receiptNumber,
        donatedAt: d.donatedAt,
      })),
      summary: {
        totalDonations: donations.length,
        totalAmount,
        averageDonation: donations.length > 0 ? totalAmount / donations.length : 0,
      },
    };
  }

  async getCampaignReport(organizationId: number, filters: CampaignReportDto) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const where: Prisma.CampaignWhereInput = {
      organizationId,
      ...(filters.status ? { status: filters.status as CampaignStatus } : {}),
      ...(filters.category ? { category: filters.category } : {}),
    };

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: {
        _count: { select: { donations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        category: c.category,
        goalAmount: c.goalAmount.toNumber(),
        currentAmount: c.currentAmount.toNumber(),
        progressPercentage:
          c.goalAmount.toNumber() > 0
            ? (c.currentAmount.toNumber() / c.goalAmount.toNumber()) * 100
            : 0,
        donationCount: c._count.donations,
        startDate: c.startDate,
        endDate: c.endDate,
        publicUrl: `/donate/${c.slug}`,
      })),
      summary: {
        totalCampaigns: campaigns.length,
        totalGoalAmount: campaigns.reduce(
          (sum, c) => sum + c.goalAmount.toNumber(),
          0,
        ),
        totalRaised: campaigns.reduce(
          (sum, c) => sum + c.currentAmount.toNumber(),
          0,
        ),
      },
    };
  }

  async getDonorReport(organizationId: number, filters: DonorReportDto) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const topDonorsLimit = filters.topDonorsLimit || 10;

    // Get all donors with their donation totals
    const donors = await this.prisma.donor.findMany({
      where: { organizationId, isActive: true },
      include: {
        donations: {
          select: { amount: true },
        },
      },
    });

    // Calculate total donated for each donor and sort
    const donorsWithTotals = donors
      .map((donor) => ({
        id: donor.id,
        fullName: donor.fullName,
        email: donor.email,
        phone: donor.phone,
        totalDonated: donor.donations.reduce(
          (sum, d) => sum + d.amount.toNumber(),
          0,
        ),
        donationCount: donor.donations.length,
        createdAt: donor.createdAt,
      }))
      .sort((a, b) => b.totalDonated - a.totalDonated)
      .slice(0, topDonorsLimit);

    return {
      data: donorsWithTotals,
      summary: {
        totalDonors: donors.length,
        topDonorTotal:
          donorsWithTotals.length > 0 ? donorsWithTotals[0].totalDonated : 0,
      },
    };
  }

  async exportDonationReportCsv(organizationId: number, filters: DonationReportDto) {
    const report = await this.getDonationReport(organizationId, filters);

    const headers = [
      'Receipt Number',
      'Amount',
      'Currency',
      'Donor Name',
      'Donor Email',
      'Campaign',
      'Payment Method',
      'Date',
    ];

    const rows = report.data.map((d) => [
      d.receiptNumber,
      d.amount.toString(),
      d.currency,
      d.donorName,
      d.donorEmail || '',
      d.campaignTitle,
      d.paymentMethod || '',
      d.donatedAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
       row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  async exportCampaignReportCsv(organizationId: number, filters: CampaignReportDto) {
    const report = await this.getCampaignReport(organizationId, filters);

    const headers = [
      'Campaign Title',
      'Status',
      'Category',
      'Goal Amount',
      'Current Amount',
      'Progress %',
      'Donation Count',
      'Start Date',
      'End Date',
      'Public URL',
    ];

    const rows = report.data.map((c) => [
      c.title,
      c.status,
      c.category || '',
      c.goalAmount.toString(),
      c.currentAmount.toString(),
      c.progressPercentage.toFixed(2),
      c.donationCount.toString(),
      c.startDate?.toISOString() || '',
      c.endDate?.toISOString() || '',
      c.publicUrl,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }

  async exportDonorReportCsv(organizationId: number, filters: DonorReportDto) {
    const report = await this.getDonorReport(organizationId, filters);

    const headers = [
      'Donor Name',
      'Email',
      'Phone',
      'Total Donated',
      'Donation Count',
      'Joined Date',
    ];

    const rows = report.data.map((d) => [
      d.fullName,
      d.email || '',
      d.phone || '',
      d.totalDonated.toString(),
      d.donationCount.toString(),
      d.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    return csvContent;
  }
}
