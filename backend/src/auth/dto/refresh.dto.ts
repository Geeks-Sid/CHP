import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token',
    example: 'a1b2c3d4e5f6...',
    minLength: 128,
  })
  @IsString()
  @Length(128, 128) // 64 bytes = 128 hex characters
  refreshToken: string;
}

