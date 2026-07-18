import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Campaign, CampaignStatus, Prisma } from '@prisma/client';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) { }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private buildPublicUrl(slug: string): string {
    return `/donate/${slug}`;
  }

  async create(organizationId: number | null, dto: CreateCampaignDto, createdById: number): Promise<Campaign & { publicUrl: string }> {
    if (!organizationId) {
      throw new NotFoundException('Organization not found for the current user');
    }

    const baseSlug = this.slugify(dto.title);
    const slug = `${baseSlug}-${Date.now()}`;

    const campaign = await this.prisma.campaign.create({
      data: {
        organizationId,
        createdById,
        title: dto.title,
        slug,
        description: dto.description,
        goalAmount: new Prisma.Decimal(dto.goalAmount),
        category: dto.category,
        bannerImageUrl: dto.bannerImageUrl,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? CampaignStatus.Draft,
      },
    });

    return {
      ...campaign,
      publicUrl: this.buildPublicUrl(campaign.slug),
    };
  }

  async findAll(organizationId: number | null, page: number, limit: number, search?: string): Promise<{ data: Array<Campaign & { publicUrl: string }>; total: number; page: number; limit: number }> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const where: Prisma.CampaignWhereInput = {
      organizationId,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: data.map((campaign) => ({ ...campaign, publicUrl: this.buildPublicUrl(campaign.slug) })),
      total,
      page,
      limit,
    };
  }

  async findOne(organizationId: number | null, campaignId: number): Promise<Campaign & { publicUrl: string }> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizationId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return { ...campaign, publicUrl: this.buildPublicUrl(campaign.slug) };
  }

  async update(organizationId: number | null, campaignId: number, dto: UpdateCampaignDto): Promise<Campaign & { publicUrl: string }> {
    await this.findOne(organizationId, campaignId);

    const updatedCampaign = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        ...(dto.title ? { title: dto.title, slug: `${this.slugify(dto.title)}-${Date.now()}` } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.goalAmount !== undefined ? { goalAmount: new Prisma.Decimal(dto.goalAmount) } : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.bannerImageUrl !== undefined ? { bannerImageUrl: dto.bannerImageUrl } : {}),
        ...(dto.startDate !== undefined ? { startDate: new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: new Date(dto.endDate) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    return { ...updatedCampaign, publicUrl: this.buildPublicUrl(updatedCampaign.slug) };
  }

  async remove(organizationId: number | null, campaignId: number): Promise<{ message: string }> {
    await this.findOne(organizationId, campaignId);

    await this.prisma.campaign.delete({ where: { id: campaignId } });

    return { message: 'Campaign deleted successfully' };
  }

  async getQrCode(campaignId: number): Promise<Buffer> {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const publicUrl = this.buildPublicUrl(campaign.slug);
    return QRCode.toBuffer(publicUrl);
  }

  async findPublicCampaigns(page: number, limit: number, search?: string): Promise<{ data: Array<Campaign & { publicUrl: string }>; total: number; page: number; limit: number }> {
    const where: Prisma.CampaignWhereInput = {
      status: CampaignStatus.Active,
      isActive: true,
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: data.map((campaign) => ({ ...campaign, publicUrl: this.buildPublicUrl(campaign.slug) })),
      total,
      page,
      limit,
    };
  }

  async findPublicCampaignBySlug(slug: string): Promise<Campaign & { publicUrl: string }> {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        slug,
        status: CampaignStatus.Active,
        isActive: true,
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return { ...campaign, publicUrl: this.buildPublicUrl(campaign.slug) };
  }
}
