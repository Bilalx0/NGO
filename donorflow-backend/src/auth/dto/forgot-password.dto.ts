import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@example.com', description: 'Email address to send a password reset link to' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
