import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ali Khan', description: 'Full name of the organization admin' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'Hope Foundation', description: 'Name of the organization to be created' })
  @IsString()
  @IsNotEmpty()
  orgName!: string;
}