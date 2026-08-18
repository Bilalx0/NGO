import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res, UseInterceptors, UploadedFile, BadRequestException
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CampaignType, UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator'; // <-- CHANGED THIS LINE
import { Roles } from '../common/decorators/roles.decorator';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { CampaignsService } from './campaigns.service';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a campaign for the current organization' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async create(
    @CurrentOrganization() organizationId: number | null,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateCampaignDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    // Use user.sub (the correct JWT payload key) instead of request.user.userId
    return this.campaignsService.create(organizationId, dto, user.sub);
  }

  // ✅ MOVED UP: Specific routes must come BEFORE parameterized routes like ':id'
  @Public()
  @Get('public')
  @ApiOperation({ summary: 'List active public campaigns across all organizations' })
  @ApiResponse({ status: 200, description: 'Public campaigns returned successfully' })
  async findPublicCampaigns(
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('search') search?: string,
  ) {
    return this.campaignsService.findPublicCampaigns(page, limit, search);
  }

  @Public()
  @Get('public/:slug')
  @ApiOperation({ summary: 'Get one active public campaign by slug' })
  @ApiResponse({ status: 200, description: 'Public campaign returned successfully' })
  async findPublicCampaignBySlug(@Param('slug') slug: string) {
    return this.campaignsService.findPublicCampaignBySlug(slug);
  }

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List campaigns for the current organization' })
  @ApiResponse({ status: 200, description: 'Campaigns returned successfully' })
  async findAll(
    @CurrentOrganization() organizationId: number | null,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('type') type?: CampaignType,
    @Query('search') search?: string,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    // ✅ PASS type TO THE SERVICE
    return this.campaignsService.findAll(organizationId, page, limit, search, type);
  }

  @Post('upload-banner')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('banner', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `banner-${uniqueSuffix}${ext}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new Error('Only image files (JPG, PNG, WebP) are allowed'), false);
      }
      cb(null, true);
    },
  }))
  @ApiOperation({ summary: 'Upload campaign banner image' })
  async uploadBanner(
    @UploadedFile() file: Express.Multer.File,
    @CurrentOrganization() organizationId: number | null,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      bannerUrl: `/uploads/${file.filename}`,
      originalName: file.originalname,
    };
  }

  @Get(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a single campaign by id for the current organization' })
  @ApiResponse({ status: 200, description: 'Campaign returned successfully' })
  async findOne(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) campaignId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.campaignsService.findOne(organizationId, campaignId);
  }

  @Get(':id/qrcode')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate a QR code for a campaign donation URL' })
  @ApiResponse({ status: 200, description: 'QR code image returned' })
  async getQrCode(
    @Param('id', ParseIntPipe) campaignId: number,
    @Res() response: Response,
  ): Promise<void> {
    const qrCodeBuffer = await this.campaignsService.getQrCode(campaignId);
    response.setHeader('Content-Type', 'image/png');
    response.send(qrCodeBuffer);
  }

  @Patch(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a campaign for the current organization' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  async update(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) campaignId: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.campaignsService.update(organizationId, campaignId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a campaign from the current organization' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  async remove(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) campaignId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.campaignsService.remove(organizationId, campaignId);
  }
}
