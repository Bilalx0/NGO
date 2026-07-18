import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDonationDto {
  @ApiProperty({ example: 5000, description: 'Donation amount' })
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'PKR', description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'EasyPaisa', description: 'Payment method (e.g., Cash, EasyPaisa, JazzCash, Bank Transfer)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'TXN123456789', description: 'Transaction or reference ID' })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID of existing donor (optional)' })
  @IsOptional()
  @IsNumber()
  donorId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID of the campaign (optional)' })
  @IsOptional()
  @IsNumber()
  campaignId?: number;

  @ApiPropertyOptional({ example: 'Received via office walk-in', description: 'Internal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}