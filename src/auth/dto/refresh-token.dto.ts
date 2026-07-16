import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh-token-value', description: 'Refresh token from the HttpOnly cookie' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
