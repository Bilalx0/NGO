import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Generate a URL-friendly slug with a unique suffix to prevent collisions
    const slugBase = dto.orgName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    // Use a transaction to ensure both Org and User are created atomically
    await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.orgName,
          slug,
        },
      });

      await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: UserRole.ORG_ADMIN, // Explicitly assign the role per PDF spec
          organizationId: organization.id,
        },
      });
    });

    return { message: 'Organization admin registered successfully' };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const refreshTokenValue = randomBytes(32).toString('hex');
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    return { message: 'Logged out successfully' };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const record = await this.prisma.refreshToken.findFirst({
      where: { token: refreshToken, revoked: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revoked: true },
    });

    const user = await this.usersService.findById(record.userId);
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    return { accessToken };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists (security best practice)
      return { message: 'If an account exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: resetTokenExpiry,
      },
    });

    // Send password reset email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    await this.mailService.sendPasswordReset(user.email, user.name, resetLink);

    return { message: 'If an account exists, a reset link has been sent' };
  }

   async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    // 1. Hash the incoming token to match what we stored in the database
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');

    // 2. Find the user with this token hash AND a non-expired date
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiry: {
          gt: new Date(), // Token must not be expired
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // 3. Hash the new password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    // 4. Update the user's password and clear the reset token fields
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,      // Clear the token so it can't be reused
        passwordResetExpiry: null,     // Clear the expiry
      },
    });

    return { message: 'Password reset successful' };
  }

  async getProfile(userId: number): Promise<{ id: number; email: string; role: UserRole; organizationId: number | null }> {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }
}
