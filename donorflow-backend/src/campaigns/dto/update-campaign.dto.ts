import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class UpdateCampaignDto {
  @ApiPropertyOptional({ example: 'Winter Relief Drive', description: 'Campaign title', minLength: 3, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'A new description for the campaign.', description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 750000, description: 'Fundraising goal amount' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? Number(value) : value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  goalAmount?: number;

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

  @ApiPropertyOptional({ enum: CampaignStatus, description: 'Campaign status' })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}
