import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CampaignReportDto {
  @ApiPropertyOptional({ example: 'Active', description: 'Filter by status (Draft, Active, Completed)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Education', description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;
}