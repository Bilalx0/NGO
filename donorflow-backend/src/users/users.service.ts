import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ): Promise<User> {
    if (!refreshToken) {
      return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    }

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
  }

  // ===== NEW METHODS FOR STAFF MANAGEMENT =====

  async createStaffMember(
    organizationId: number,
    dto: CreateStaffDto,
  ): Promise<{ user: Omit<User, 'passwordHash'>; tempPassword: string }> {
    // Check if email already exists
    const existingUser = await this.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Generate a temporary password
    const tempPassword = `Temp${Date.now().toString().slice(-6)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create the staff member
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        passwordHash,
        role: dto.role || UserRole.STAFF,
        organizationId,
        isActive: true,
      },
    });

    // Exclude passwordHash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tempPassword,
    };
  }

  async findAllByOrganization(
    organizationId: number,
    page: number,
    limit: number,
    search?: string,
  ): Promise<{
    data: Array<Omit<User, 'passwordHash'>>;
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Prisma.UserWhereInput = {
      organizationId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Exclude passwordHash from all users
    const usersWithoutPasswords = users.map(
      ({ passwordHash: _, ...user }) => user,
    );

    return {
      data: usersWithoutPasswords,
      total,
      page,
      limit,
    };
  }

  async updateUser(
    organizationId: number,
    userId: number,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'passwordHash'>> {
    // Verify the user belongs to this organization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found or access denied');
    }

    // Prevent changing SUPER_ADMIN role
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot assign SUPER_ADMIN role');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async deactivateUser(
    organizationId: number,
    userId: number,
    currentUserId: number,
  ): Promise<{ message: string }> {
    // Prevent self-deactivation
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    // Verify the user belongs to this organization
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found or access denied');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }
}