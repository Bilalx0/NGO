import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, Min } from 'class-validator';

export class DonationReportDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by campaign ID' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  campaignId?: number;

  @ApiPropertyOptional({ example: 'EasyPaisa', description: 'Filter by payment method' })
  @IsOptional()
  paymentMethod?: string;
}