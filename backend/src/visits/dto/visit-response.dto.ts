import { ApiProperty } from '@nestjs/swagger';

export class VisitResponseDto {
    @ApiProperty({ example: 987 })
    visit_occurrence_id: number;

    @ApiProperty({ example: 123 })
    person_id: number;

    @ApiProperty({ example: 9201 })
    visit_concept_id: number;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    visit_start: Date;

    @ApiProperty({ example: '2024-01-15T11:00:00.000Z', required: false })
    visit_end?: Date;

    @ApiProperty({ example: 'OPD', enum: ['OPD', 'IPD', 'ER'] })
    visit_type: 'OPD' | 'IPD' | 'ER';

    @ApiProperty({ example: 5, required: false })
    department_id?: number;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    provider_id?: string;

    @ApiProperty({ example: 'Routine checkup', required: false })
    reason?: string;

    @ApiProperty({ example: 'V-2024-000987' })
    visit_number: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at: Date;
}

export class VisitListResponseDto {
    @ApiProperty({ type: [VisitResponseDto] })
    items: VisitResponseDto[];

    @ApiProperty({ example: 'eyJ2aXNpdF9vY2N1cnJlbmNlX2lkIjo5ODd9', required: false })
    nextCursor?: string;
}

