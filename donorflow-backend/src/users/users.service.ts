import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from '../mail/mail.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

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

  async create(organizationId: number | null, dto: any) {
    console.log('🚀 [DEBUG] UsersService.create called with orgId:', organizationId, 'and data:', dto);

    if (!organizationId) {
      throw new ForbiddenException('User does not belong to an organization');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        role: dto.role,
        organizationId,
        passwordHash: 'temporary',
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    console.log('✅ [DEBUG] User created in database. ID:', user.id);

    // SEND THE EMAIL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log('📧 [DEBUG] Attempting to send email to:', user.email);
    console.log('🔗 [DEBUG] Invite link:', inviteLink);

    try {
      await this.mailService.sendUserInvitation(user.email, user.name, inviteLink);
      console.log('🎉 [DEBUG] Email sent successfully!');
    } catch (emailError) {
      console.error('❌ [DEBUG] Email failed to send:', emailError);
      // We don't throw here so the user is still created even if email fails
    }

    return user;
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

    // Generate a temporary password (fallback)
    const tempPassword = `Temp${Date.now().toString().slice(-6)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Generate reset token for the "Set Password" invitation link
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

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
        passwordResetToken: resetTokenHash, // ✅ Added for invitation link
        passwordResetExpiry: resetTokenExpiry, // ✅ Added for invitation link
      },
    });

    // ✅ SEND THE INVITATION EMAIL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    console.log('📧 [DEBUG] Attempting to send invitation email to:', user.email);
    console.log('🔗 [DEBUG] Invite link:', inviteLink);

    try {
      await this.mailService.sendUserInvitation(user.email, user.name, inviteLink);
      console.log('🎉 [DEBUG] Invitation email sent successfully!');
    } catch (emailError) {
      console.error('❌ [DEBUG] Email failed to send:', emailError);
      // We don't throw here so the user is still created even if email fails
    }

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

    async deleteUser(
    organizationId: number,
    userId: number,
    currentUserId: number,
  ): Promise<{ message: string }> {
    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
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

    // Permanently delete the user
    await this.prisma.user.delete({
      where: { id: userId }
    });

    return { message: 'User permanently deleted' };
  }
}