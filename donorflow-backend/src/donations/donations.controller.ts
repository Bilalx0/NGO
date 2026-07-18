import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PublicDonationDto } from './dto/public-donation.dto';
import { DonationsService } from './donations.service';

@ApiTags('donations')
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Record an internal/manual donation' })
  @ApiResponse({ status: 201, description: 'Donation recorded successfully' })
  async createInternal(
    @CurrentOrganization() organizationId: number | null,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateDonationDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donationsService.createInternal(organizationId, user.sub, dto);
  }

  @Public()
  @Post('public')
  @ApiOperation({ summary: 'Submit a public donation via campaign page' })
  @ApiResponse({ status: 201, description: 'Public donation processed successfully' })
  async createPublic(@Body() dto: PublicDonationDto) {
    return this.donationsService.createPublic(dto);
  }

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all donations for the current organization' })
  @ApiResponse({ status: 200, description: 'Donations returned successfully' })
  async findAll(
    @CurrentOrganization() organizationId: number | null,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donationsService.findAll(organizationId, page, limit);
  }

  @Get(':id/receipt')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get receipt details for a specific donation' })
  @ApiResponse({ status: 200, description: 'Receipt details returned' })
  async getReceipt(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) donationId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donationsService.getReceipt(organizationId, donationId);
  }
}