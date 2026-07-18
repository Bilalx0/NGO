import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-value', description: 'Password reset token received from the reset link' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewStrongPass123!', description: 'New password for the account' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
