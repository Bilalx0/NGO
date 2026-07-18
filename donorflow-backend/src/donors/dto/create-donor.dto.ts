import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDonorDto {
  @ApiProperty({ example: 'Ahmed Raza', description: 'Donor full name', minLength: 2, maxLength: 200 })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  fullName!: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com', description: 'Donor email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+92 300 1234567', description: 'Donor phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Gulberg, Lahore', description: 'Donor address' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'Prefers annual reports via WhatsApp', description: 'Internal notes about the donor' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
