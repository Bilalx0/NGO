import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min, MinLength } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Winter Relief Drive', description: 'Campaign title', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'Help families through the winter season.', description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 500000, description: 'Fundraising goal amount' })
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  goalAmount!: number;

  @ApiPropertyOptional({ example: 'Education', description: 'Campaign category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png', description: 'Banner image URL' })
  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'Campaign start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Campaign end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: CampaignStatus, default: CampaignStatus.Draft, description: 'Campaign status' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
