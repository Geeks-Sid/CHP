import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMedicationInventoryDto {
    @ApiProperty({
        description: 'Drug concept ID (optional, for terminology integration)',
        example: 19122137,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    drug_concept_id?: number;

    @ApiProperty({
        description: 'Medication name',
        example: 'Amoxicillin 500mg',
        required: false,
    })
    @IsOptional()
    @IsString()
    medication_name?: string;

    @ApiProperty({
        description: 'Reorder level (minimum stock before alert)',
        example: 50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    reorder_level?: number;

    @ApiProperty({
        description: 'Unit of measure',
        example: 'unit',
        required: false,
    })
    @IsOptional()
    @IsString()
    unit_of_measure?: string;

    @ApiProperty({
        description: 'Cost per unit',
        example: 10.50,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost_per_unit?: number;

    @ApiProperty({
        description: 'Selling price per unit',
        example: 15.00,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    selling_price_per_unit?: number;

    @ApiProperty({
        description: 'Storage location',
        example: 'Pharmacy A',
        required: false,
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: 'Batch/lot number',
        example: 'BATCH-2024-001',
        required: false,
    })
    @IsOptional()
    @IsString()
    batch_number?: string;

    @ApiProperty({
        description: 'Expiration date (ISO 8601)',
        example: '2025-12-31',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    expiration_date?: string;

    @ApiProperty({
        description: 'Supplier ID',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    supplier_id?: number;

    @ApiProperty({
        description: 'Active status',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

