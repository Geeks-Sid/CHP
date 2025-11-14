import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FillPrescriptionDto {
    @ApiProperty({
        description: 'Medication inventory ID to use for filling',
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    medication_inventory_id?: number;

    @ApiProperty({
        description: 'Notes about the fill',
        example: 'Patient picked up prescription',
        required: false,
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

