import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProcedureDto {
    @ApiProperty({
        description: 'Procedure concept ID',
        example: 123456,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    procedure_concept_id?: number;

    @ApiProperty({
        description: 'Procedure date (ISO 8601)',
        example: '2024-01-15T10:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    procedure_date?: string;

    @ApiProperty({
        description: 'Procedure type concept ID',
        example: 4478661,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    procedure_type_concept_id?: number;

    @ApiProperty({
        description: 'Visit occurrence ID (optional)',
        example: 987,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    visit_occurrence_id?: number;
}

