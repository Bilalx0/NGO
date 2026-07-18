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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentOrganization } from '../common/decorators/current-organization.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new staff member for the organization' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  async createStaff(
    @CurrentOrganization() organizationId: number | null,
    @Body() dto: CreateStaffDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.usersService.createStaffMember(organizationId, dto);
  }

@Get()
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List all users for the current organization' })
  @ApiResponse({ status: 200, description: 'Users returned successfully' })
  async findAll(
    @CurrentOrganization() organizationId: number | null,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('search') search?: string,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.usersService.findAllByOrganization(
      organizationId,
      page,
      limit,
      search,
    );
  }

  @Patch(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a user role or status' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @CurrentOrganization() organizationId: number | null,
    @Param('id', ParseIntPipe) userId: number,
    @Body() dto: UpdateUserDto,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.usersService.updateUser(organizationId, userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ORG_ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Deactivate a user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  async deactivateUser(
    @CurrentOrganization() organizationId: number | null,
    @CurrentUser() currentUser: JwtUserPayload,
    @Param('id', ParseIntPipe) userId: number,
  ) {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }
    return this.usersService.deactivateUser(
      organizationId,
      userId,
      currentUser.sub,
    );
  }
}