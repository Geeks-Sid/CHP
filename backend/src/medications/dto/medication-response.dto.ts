import { ApiProperty } from '@nestjs/swagger';

export class MedicationResponseDto {
    @ApiProperty({ example: 321 })
    drug_exposure_id: number;

    @ApiProperty({ example: 123 })
    person_id: number;

    @ApiProperty({ example: 19122137 })
    drug_concept_id: number;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    drug_exposure_start: Date;

    @ApiProperty({ example: '2024-01-29T10:00:00.000Z', required: false })
    drug_exposure_end?: Date;

    @ApiProperty({ example: 38000177 })
    drug_type_concept_id: number;

    @ApiProperty({ example: 14, required: false })
    quantity?: number;

    @ApiProperty({ example: 987, required: false })
    visit_occurrence_id?: number;

    @ApiProperty({ example: 'Take with food, twice daily', required: false })
    instructions?: string;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-15T10:00:00.000Z' })
    updated_at: Date;
}

export class MedicationListResponseDto {
    @ApiProperty({ type: [MedicationResponseDto] })
    items: MedicationResponseDto[];

    @ApiProperty({ example: 'eyJkcnVnX2V4cG9zdXJlX2lkIjozMjF9', required: false })
    nextCursor?: string;
}

