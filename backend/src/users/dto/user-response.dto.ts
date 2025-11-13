import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  user_id: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: ['Doctor', 'Nurse'] })
  roles: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updated_at: Date;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items: UserResponseDto[];

  @ApiProperty({ example: 'eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIn0=', required: false })
  nextCursor?: string;
}

