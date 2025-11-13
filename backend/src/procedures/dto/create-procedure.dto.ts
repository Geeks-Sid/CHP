import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateProcedureDto {
    @ApiProperty({
        description: 'Patient person ID',
        example: 123,
    })
    @IsInt()
    @Min(1)
    person_id: number;

    @ApiProperty({
        description: 'Procedure concept ID',
        example: 123456,
    })
    @IsInt()
    @Min(1)
    procedure_concept_id: number;

    @ApiProperty({
        description: 'Procedure date (ISO 8601)',
        example: '2024-01-15T10:00:00Z',
    })
    @IsDateString()
    procedure_date: string;

    @ApiProperty({
        description: 'Procedure type concept ID',
        example: 4478661,
    })
    @IsInt()
    @Min(1)
    procedure_type_concept_id: number;

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

