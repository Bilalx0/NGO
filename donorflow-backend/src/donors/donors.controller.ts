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
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { DonorsService } from './donors.service';

@ApiTags('donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new donor' })
  @ApiResponse({ status: 201, description: 'Donor created successfully' })
  async create(
    @CurrentOrganization() organizationId: number | null,
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateDonorDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donorsService.create(organizationId, user.sub, dto);
  }

  // ✅ REPLACED: Now accepts CSV file upload instead of JSON array
  @Post('import')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Import donors from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Donors imported successfully' })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
        return callback(new BadRequestException('Only CSV files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  async importDonors(
    @CurrentOrganization() organizationId: number | null,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const result = await this.donorsService.importDonorsFromCsv(
      organizationId,
      file.buffer,
    );

    return {
      message: `Successfully imported ${result.imported} donors. ${result.skipped} duplicates skipped. ${result.errors.length} errors.`,
      ...result,
    };
  }

  @Get('export')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Export all donors as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file downloaded' })
  async exportDonors(
    @CurrentOrganization() organizationId: number | null,
    @Res() response: Response,
  ): Promise<void> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    const csvContent = await this.donorsService.exportToCsv(organizationId);
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename=donors.csv');
    response.send(csvContent);
  }

  @Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all donors for the current organization' })
  @ApiResponse({ status: 200, description: 'Donors returned successfully' })
  async findAll(
    @CurrentOrganization() organizationId: number | null,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1, 
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donorsService.findAll(organizationId, page, limit, search);
  }

  @Get(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a single donor by ID with donation history' })
  @ApiResponse({ status: 200, description: 'Donor returned successfully' })
  async findOne(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) donorId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donorsService.findOne(organizationId, donorId);
  }

  @Patch(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a donor' })
  @ApiResponse({ status: 200, description: 'Donor updated successfully' })
  async update(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) donorId: number,
    @Body() dto: UpdateDonorDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donorsService.update(organizationId, donorId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate a donor (soft delete)' })
  @ApiResponse({ status: 200, description: 'Donor deactivated successfully' })
  async remove(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) donorId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.donorsService.remove(organizationId, donorId);
  }
}
