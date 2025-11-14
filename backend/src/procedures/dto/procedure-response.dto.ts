import { ApiProperty } from '@nestjs/swagger';

export class ProcedureResponseDto {
    @ApiProperty({ example: 456 })
    procedure_occurrence_id!: number;

    @ApiProperty({ example: 123 })
    person_id!: number;

    @ApiProperty({ example: 123456 })
    procedure_concept_id!: number;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    procedure_date!: Date;

    @ApiProperty({ example: 4478661 })
    procedure_type_concept_id!: number;

    @ApiProperty({ example: 987, required: false })
    visit_occurrence_id?: number;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at!: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at!: Date;

    @ApiProperty({
        description: 'Patient name (joined from person table)',
        example: 'John Doe',
        required: false,
    })
    patient_name?: string;

    @ApiProperty({
        description: 'Procedure name (joined from concept table)',
        example: 'Blood Test',
        required: false,
    })
    procedure_name?: string;
}

export class ProcedureListResponseDto {
    @ApiProperty({ type: [ProcedureResponseDto] })
    items!: ProcedureResponseDto[];

    @ApiProperty({ example: 'eyJwcm9jZWR1cmVfb2NjdXJyZW5jZV9pZCI6NDU2fQ==', required: false })
    nextCursor?: string;
}

