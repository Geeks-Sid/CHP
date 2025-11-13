import {
  IsString,
  IsEmail,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username (unique)',
    example: 'johndoe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'Email address (unique)',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Password (must meet security requirements)',
    example: 'SecurePass123!',
    minLength: 12,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    description: 'Role IDs to assign to user',
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role must be assigned' })
  @IsInt({ each: true })
  role_ids?: number[];
}

