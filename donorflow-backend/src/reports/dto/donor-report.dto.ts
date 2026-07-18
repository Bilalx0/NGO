import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class DonorReportDto {
  @ApiPropertyOptional({ example: 10, description: 'Number of top donors to return' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  topDonorsLimit?: number;
}