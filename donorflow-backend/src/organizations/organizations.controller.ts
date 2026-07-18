import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('me')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the current organization profile' })
  @ApiResponse({ status: 200, description: 'Organization profile returned' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async getMyOrganization(
    @CurrentOrganization() organizationId: number | null,
  ) {
    return this.organizationsService.findById(organizationId);
  }

  @Patch('me')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update the current organization profile' })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  async updateMyOrganization(
    @CurrentOrganization() organizationId: number | null,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(organizationId, dto);
  }
}
