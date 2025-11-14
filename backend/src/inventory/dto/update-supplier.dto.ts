import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateSupplierDto {
    @ApiProperty({
        description: 'Supplier name',
        example: 'GlobalPharma',
        required: false,
    })
    @IsOptional()
    @IsString()
    supplier_name?: string;

    @ApiProperty({
        description: 'Contact person name',
        example: 'John Doe',
        required: false,
    })
    @IsOptional()
    @IsString()
    contact_person?: string;

    @ApiProperty({
        description: 'Email address',
        example: 'contact@globalpharma.com',
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'Phone number',
        example: '+1-555-123-4567',
        required: false,
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: 'Address',
        example: '123 Medical Supply St, City, State 12345',
        required: false,
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({
        description: 'Active status',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

