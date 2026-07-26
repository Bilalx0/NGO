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

  // ✅ NEW: CSV Import Method
  async importDonorsFromCsv(
    organizationId: number,
    csvBuffer: Buffer,
  ): Promise<{
    imported: number;
    skipped: number;
    errors: Array<{ row: number; name: string; error: string }>;
  }> {
    const csvText = csvBuffer.toString('utf-8');
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== '');

    if (lines.length < 2) {
      return { imported: 0, skipped: 0, errors: [{ row: 1, name: 'N/A', error: 'CSV file is empty or has no data rows' }] };
    }

    // Parse header row to find column indices
    const headers = this.parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const nameIndex = headers.findIndex((h) => h === 'name' || h === 'full name' || h === 'fullname');
    const emailIndex = headers.findIndex((h) => h === 'email');
    const phoneIndex = headers.findIndex((h) => h === 'phone');
    const addressIndex = headers.findIndex((h) => h === 'address');

    if (nameIndex === -1 || emailIndex === -1) {
      return {
        imported: 0,
        skipped: 0,
        errors: [{ row: 1, name: 'N/A', error: 'CSV must have "name" and "email" columns' }],
      };
    }

    let imported = 0;
    let skipped = 0;
    const errors: Array<{ row: number; name: string; error: string }> = [];

    // Process each data row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1;
      const columns = this.parseCsvLine(lines[i]);

      const name = (columns[nameIndex] || '').trim();
      const email = (columns[emailIndex] || '').trim().toLowerCase();
      const phone = phoneIndex !== -1 ? (columns[phoneIndex] || '').trim() : '';
      const address = addressIndex !== -1 ? (columns[addressIndex] || '').trim() : '';

      // Validate required fields
      if (!name || !email) {
        errors.push({ row: rowNumber, name: name || 'N/A', error: 'Missing required fields: name and email' });
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({ row: rowNumber, name, error: `Invalid email format: ${email}` });
        continue;
      }

      // Check for duplicate email in this organization
      const existing = await this.prisma.donor.findFirst({
        where: { organizationId, email },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create the donor
      try {
        await this.prisma.donor.create({
          data: {
            fullName: name,
            email,
            phone: phone || null,
            address: address || null,
            organizationId,
            isActive: true,
          },
        });
        imported++;
      } catch (err) {
        errors.push({ row: rowNumber, name, error: 'Database error while creating donor' });
      }
    }

    return { imported, skipped, errors };
  }

  // ✅ Helper: Parse a single CSV line (handles quoted fields with commas)
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
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