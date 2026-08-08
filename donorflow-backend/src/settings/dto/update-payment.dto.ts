import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentDto {
  @ApiPropertyOptional({ example: '1234567890', description: 'Merchant ID or Store ID' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ example: 'sk_test_123xyz', description: 'API Key or Password. Will be encrypted.' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiProperty({ 
    example: false, 
    description: 'True for Production/Live mode, False for Sandbox/Test mode' 
  })
  @IsBoolean()
  isLiveMode!: boolean;
}