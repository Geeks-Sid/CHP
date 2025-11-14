import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWarehouseItemDto {
    @ApiProperty({
        description: 'Item name',
        example: 'Medical Gloves (Box)',
        required: false,
    })
    @IsOptional()
    @IsString()
    item_name?: string;

    @ApiProperty({
        description: 'Item category',
        example: 'Supplies',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

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
        example: 'box',
        required: false,
    })
    @IsOptional()
    @IsString()
    unit_of_measure?: string;

    @ApiProperty({
        description: 'Cost per unit',
        example: 15.00,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    cost_per_unit?: number;

    @ApiProperty({
        description: 'Storage location',
        example: 'Warehouse B',
        required: false,
    })
    @IsOptional()
    @IsString()
    location?: string;

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

