import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  // Helper to safely extract a valid organization ID
  private assertOrg(orgId: number | null): number {
    if (!orgId) {
      throw new ForbiddenException(
        'Settings require an organization context. Please login as an Organization Admin.',
      );
    }
    return orgId;
  }

  async getOrganizationSettings(orgId: number | null) {
    const validOrgId = this.assertOrg(orgId);
    const org = await this.prisma.organization.findUnique({
      where: { id: validOrgId },
      include: { paymentConfigs: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateBranding(orgId: number | null, dto: UpdateBrandingDto) {
    const validOrgId = this.assertOrg(orgId);
    return this.prisma.organization.update({
      where: { id: validOrgId },
      data: {
        primaryColor: dto.primaryColor,
        secondaryColor: dto.secondaryColor,
        logoUrl: dto.logoUrl,
        registrationNo: dto.registrationNo,
      },
    });
  }

  async updatePaymentConfig(orgId: number | null, provider: string, data: any) {
    const validOrgId = this.assertOrg(orgId);
    return this.prisma.paymentConfig.upsert({
      where: {
        organizationId_provider: {
          organizationId: validOrgId,
          provider: provider,
        },
      },
      update: {
        merchantId: data.merchantId,
        apiKey: data.apiKey,
        isLiveMode: data.isLiveMode,
      },
      create: {
        organizationId: validOrgId,
        provider: provider,
        merchantId: data.merchantId,
        apiKey: data.apiKey,
        isLiveMode: data.isLiveMode,
      },
    });
  }
}