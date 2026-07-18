import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Update user role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Activate or deactivate user' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}