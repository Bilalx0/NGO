import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentSessionDto {
  @ApiProperty({ example: 'winter-relief-2026', description: 'Campaign slug the donor is paying for' })
  @IsString()
  campaignSlug!: string;

  @ApiProperty({ example: 1000, description: 'Donation amount in the organization currency' })
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(50)
  amount!: number;

  @ApiPropertyOptional({ example: 'Ali Khan', description: 'Donor full name' })
  @IsOptional()
  @IsString()
  donorName?: string;

  @ApiPropertyOptional({ example: 'ali@example.com', description: 'Donor email' })
  @IsOptional()
  @IsEmail()
  donorEmail?: string;

  @ApiPropertyOptional({ example: '+92 300 1234567', description: 'Donor phone' })
  @IsOptional()
  @IsString()
  donorPhone?: string;

  @ApiPropertyOptional({ example: 'CARD', description: 'Preferred payment method category' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: true, description: 'Whether this should be a recurring monthly subscription' })
  @IsOptional()
  @IsBoolean()
  isMonthly?: boolean;
}
