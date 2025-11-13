import {
  IsString,
  IsEmail,
  IsBoolean,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
  ArrayMinSize,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({
    description: 'New password (must meet security requirements)',
    example: 'NewSecurePass123!',
    minLength: 12,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password?: string;

  @ApiProperty({
    description: 'Active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

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

