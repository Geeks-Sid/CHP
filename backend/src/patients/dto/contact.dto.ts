import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class ContactDto {
    @ApiProperty({
        description: 'Phone number',
        example: '+1234567890',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^\+?[1-9]\d{1,14}$/, {
        message: 'Invalid phone number format',
    })
    phone?: string;

    @ApiProperty({
        description: 'Email address',
        example: 'patient@example.com',
        required: false,
    })
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;
}

