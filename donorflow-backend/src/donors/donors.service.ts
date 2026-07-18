import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Donor, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';

@Injectable()
export class DonorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: number, userId: number, dto: CreateDonorDto): Promise<Donor> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    return this.prisma.donor.create({
      data: {
        fullName: dto.fullName,
        email: dto.email || null,
        phone: dto.phone || null,
        address: dto.address || null,
        notes: dto.notes || null,
        organizationId,
        createdById: userId,
      },
    });
  }

  async findAll(
    organizationId: number,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: Donor[]; total: number; page: number; limit: number }> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const where: Prisma.DonorWhereInput = {
      organizationId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.donor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.donor.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(organizationId: number, donorId: number): Promise<Donor> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const donor = await this.prisma.donor.findFirst({
      where: {
        id: donorId,
        organizationId,
        isActive: true,
      },
      include: {
        donations: {
          orderBy: { donatedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!donor) {
      throw new NotFoundException('Donor not found or access denied');
    }

    return donor;
  }

  async update(organizationId: number, donorId: number, dto: UpdateDonorDto): Promise<Donor> {
    await this.findOne(organizationId, donorId);

    return this.prisma.donor.update({
      where: { id: donorId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async remove(organizationId: number, donorId: number): Promise<{ message: string }> {
    await this.findOne(organizationId, donorId);

    await this.prisma.donor.update({
      where: { id: donorId },
      data: { isActive: false },
    });

    return { message: 'Donor deactivated successfully' };
  }

  async bulkCreate(organizationId: number, userId: number, donors: CreateDonorDto[]): Promise<{ created: number; skipped: number }> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    let created = 0;
    let skipped = 0;

    for (const donor of donors) {
      try {
        await this.prisma.donor.create({
          data: {
            fullName: donor.fullName,
            email: donor.email || null,
            phone: donor.phone || null,
            address: donor.address || null,
            notes: donor.notes || null,
            organizationId,
            createdById: userId,
          },
        });
        created++;
      } catch {
        skipped++;
      }
    }

    return { created, skipped };
  }

  async exportToCsv(organizationId: number): Promise<string> {
    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const donors = await this.prisma.donor.findMany({
      where: { organizationId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Full Name', 'Email', 'Phone', 'Address', 'Notes', 'Created At'];
    const rows = donors.map((donor) => [
      donor.fullName,
      donor.email || '',
      donor.phone || '',
      donor.address || '',
      donor.notes || '',
      donor.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}