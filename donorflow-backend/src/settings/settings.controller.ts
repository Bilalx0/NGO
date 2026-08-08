import {
  Controller, Get, Patch, Post, Body, Param, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

import { SettingsService } from './settings.service';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';

// --- Manual validation config (works with diskStorage) ---
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + extname(file.originalname));
  },
});

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('organization')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  async getSettings(@CurrentOrganization() orgId: number | null) {
    return this.settingsService.getOrganizationSettings(orgId);
  }

  @Patch('branding')
  @Roles(UserRole.ORG_ADMIN)
  @UseInterceptors(FileInterceptor('logo', { storage }))
  @ApiConsumes('multipart/form-data')
  async updateBranding(
    @CurrentOrganization() orgId: number | null,
    @Body() dto: UpdateBrandingDto,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    let logoUrl = dto.logoUrl;

    if (logoFile) {
      // ✅ Manual type validation (diskStorage has no buffer for FileTypeValidator)
      if (!ALLOWED_MIME_TYPES.includes(logoFile.mimetype)) {
        fs.unlinkSync(logoFile.path); // Delete invalid file from disk
        throw new BadRequestException('Invalid file type. Only JPG, PNG, WEBP, SVG allowed.');
      }

      // ✅ Manual size validation
      if (logoFile.size > MAX_FILE_SIZE) {
        fs.unlinkSync(logoFile.path); // Delete oversized file from disk
        throw new BadRequestException('File too large. Maximum size is 2MB.');
      }

      logoUrl = `/uploads/${logoFile.filename}`;
    }

    return this.settingsService.updateBranding(orgId, { ...dto, logoUrl });
  }

  @Post('payments/:provider')
  @Roles(UserRole.ORG_ADMIN)
  async updatePayment(
    @CurrentOrganization() orgId: number | null,
    @Param('provider') provider: string,
    @Body() data: any,
  ) {
    return this.settingsService.updatePaymentConfig(orgId, provider.toUpperCase(), data);
  }
}