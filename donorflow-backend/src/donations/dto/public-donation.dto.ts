import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class PublicDonationDto {
  @ApiProperty({ example: 'winter-relief-2026-1234', description: 'Campaign slug' })
  @IsString()
  campaignSlug!: string;

  @ApiProperty({ example: 5000, description: 'Donation amount' })
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Ali Khan', description: 'Donor full name' })
  @IsString()
  donorName!: string;

  @ApiPropertyOptional({ example: 'ali@example.com', description: 'Donor email' })
  @IsOptional()
  @IsEmail()
  donorEmail?: string;

  @ApiPropertyOptional({ example: '+92 300 1234567', description: 'Donor phone' })
  @IsOptional()
  @IsString()
  donorPhone?: string;

  @ApiPropertyOptional({ example: 'EasyPaisa', description: 'Payment method' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'TXN987654', description: 'Payment reference' })
  @IsOptional()
  @IsString()
  paymentReference?: string;
}