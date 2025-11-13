import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateMedicationDto {
    @ApiProperty({
        description: 'Drug concept ID',
        example: 19122137,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    drug_concept_id?: number;

    @ApiProperty({
        description: 'Drug exposure start date (ISO 8601)',
        example: '2024-01-15T10:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    drug_exposure_start_date?: string;

    @ApiProperty({
        description: 'Drug exposure end date (ISO 8601)',
        example: '2024-01-29T10:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    drug_exposure_end_date?: string;

    @ApiProperty({
        description: 'Drug type concept ID',
        example: 38000177,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    drug_type_concept_id?: number;

    @ApiProperty({
        description: 'Quantity',
        example: 14,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;

    @ApiProperty({
        description: 'Visit occurrence ID (optional)',
        example: 987,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    visit_occurrence_id?: number;

    @ApiProperty({
        description: 'Instructions for medication',
        example: 'Take with food, twice daily',
        required: false,
    })
    @IsOptional()
    @IsString()
    instructions?: string;
}

