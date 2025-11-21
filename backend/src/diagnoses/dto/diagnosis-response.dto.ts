import { ApiProperty } from '@nestjs/swagger';

export class DiagnosisResponseDto {
    @ApiProperty({ example: 789 })
    condition_occurrence_id!: number;

    @ApiProperty({ example: 123 })
    person_id!: number;

    @ApiProperty({ example: 440383 })
    condition_concept_id!: number;

    @ApiProperty({
        description: 'Condition concept name (joined from concept table)',
        example: 'Acute upper respiratory infection',
        required: false,
    })
    condition_concept_name?: string;

    @ApiProperty({
        description: 'ICD-10 code (joined from concept table)',
        example: 'J06.9',
        required: false,
    })
    condition_concept_code?: string;

    @ApiProperty({ example: '2024-01-15' })
    condition_start_date!: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z', required: false })
    condition_start_datetime?: string;

    @ApiProperty({ example: '2024-02-15', required: false })
    condition_end_date?: string;

    @ApiProperty({ example: '2024-02-15T10:00:00.000Z', required: false })
    condition_end_datetime?: string;

    @ApiProperty({ example: 32827 })
    condition_type_concept_id!: number;

    @ApiProperty({
        description: 'Diagnosis type name',
        example: 'Acute',
        required: false,
    })
    condition_type_name?: string;

    @ApiProperty({ example: 32902, required: false })
    condition_status_concept_id?: number;

    @ApiProperty({
        description: 'Condition status name',
        example: 'Active',
        required: false,
    })
    condition_status_name?: string;

    @ApiProperty({ required: false })
    stop_reason?: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', required: false })
    provider_id?: string;

    @ApiProperty({
        description: 'Provider name (joined from users)',
        example: 'Dr. Smith',
        required: false,
    })
    provider_name?: string;

    @ApiProperty({ example: 456, required: false })
    visit_occurrence_id?: number;

    @ApiProperty({
        description: 'Visit number (joined from visit_occurrence)',
        example: 'V2024-001234',
        required: false,
    })
    visit_number?: string;

    @ApiProperty({ example: 'Primary', required: false })
    diagnosis_category?: string;

    @ApiProperty({ example: true })
    is_principal_diagnosis!: boolean;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at!: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at!: string;

    @ApiProperty({ required: false })
    created_by?: string;

    @ApiProperty({ required: false })
    updated_by?: string;
}

export class DiagnosisListResponseDto {
    @ApiProperty({ type: [DiagnosisResponseDto] })
    items!: DiagnosisResponseDto[];

    @ApiProperty({ example: 'eyJjb25kaXRpb25fb2NjdXJyZW5jZV9pZCI6Nzg5fQ==', required: false })
    nextCursor?: string;
}

