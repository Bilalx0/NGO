import { Injectable, NotFoundException } from '@nestjs/common';
import { Organization } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(organizationId: number | null): Promise<Organization> {
    if (!organizationId) {
      throw new NotFoundException('Organization not found for the current user');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(organizationId: number | null, dto: UpdateOrganizationDto): Promise<Organization> {
    await this.findById(organizationId);

    return this.prisma.organization.update({
      where: { id: organizationId as number },
      data: dto,
    });
  }
}
