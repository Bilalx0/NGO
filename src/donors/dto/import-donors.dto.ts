import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDonorDto } from './create-donor.dto';

export class ImportDonorsDto {
  @ApiProperty({ type: [CreateDonorDto], description: 'Array of donors to import' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDonorDto)
  donors!: CreateDonorDto[];
}