import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CampaignReportDto } from './dto/campaign-report.dto';
import { DonationReportDto } from './dto/donation-report.dto';
import { DonorReportDto } from './dto/donor-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get dashboard statistics for the organization' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned' })
  async getDashboardStats(
    @CurrentOrganization() organizationId: number | null,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.reportsService.getDashboardStats(organizationId);
  }

  @Get('donations')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get donation report with filters' })
  @ApiResponse({ status: 200, description: 'Donation report returned' })
  async getDonationReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: DonationReportDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.reportsService.getDonationReport(organizationId, filters);
  }

  @Get('donations/export')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Export donation report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportDonationReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: DonationReportDto,
    @Res() response: Response,
  ): Promise<void> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    const csvContent = await this.reportsService.exportDonationReportCsv(
      organizationId,
      filters,
    );
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=donation-report.csv',
    );
    response.send(csvContent);
  }

  @Get('campaigns')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get campaign performance report' })
  @ApiResponse({ status: 200, description: 'Campaign report returned' })
  async getCampaignReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: CampaignReportDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.reportsService.getCampaignReport(organizationId, filters);
  }

  @Get('campaigns/export')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Export campaign report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportCampaignReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: CampaignReportDto,
    @Res() response: Response,
  ): Promise<void> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    const csvContent = await this.reportsService.exportCampaignReportCsv(
      organizationId,
      filters,
    );
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=campaign-report.csv',
    );
    response.send(csvContent);
  }

  @Get('donors')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get donor report (top donors)' })
  @ApiResponse({ status: 200, description: 'Donor report returned' })
  async getDonorReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: DonorReportDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.reportsService.getDonorReport(organizationId, filters);
  }

  @Get('donors/export')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Export donor report as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportDonorReport(
    @CurrentOrganization() organizationId: number | null,
    @Query() filters: DonorReportDto,
    @Res() response: Response,
  ): Promise<void> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    const csvContent = await this.reportsService.exportDonorReportCsv(
      organizationId,
      filters,
    );
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename=donor-report.csv',
    );
    response.send(csvContent);
  }
}