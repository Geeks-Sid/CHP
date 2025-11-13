import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
    @ApiProperty({ example: 123 })
    person_id: number;

    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
    user_id?: string;

    @ApiProperty({ example: 'John', required: false })
    first_name?: string;

    @ApiProperty({ example: 'Doe', required: false })
    last_name?: string;

    @ApiProperty({ example: 8507 })
    gender_concept_id: number;

    @ApiProperty({ example: 1980 })
    year_of_birth: number;

    @ApiProperty({ example: 5, required: false })
    month_of_birth?: number;

    @ApiProperty({ example: 15, required: false })
    day_of_birth?: number;

    @ApiProperty({ example: '1980-05-15T00:00:00.000Z', required: false })
    birth_datetime?: Date;

    @ApiProperty({ example: 8527, required: false })
    race_concept_id?: number;

    @ApiProperty({ example: 38003564, required: false })
    ethnicity_concept_id?: number;

    @ApiProperty({ example: 'MRN-2024-000123' })
    mrn: string;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    created_at: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
    updated_at: Date;
}

export class PatientListResponseDto {
    @ApiProperty({ type: [PatientResponseDto] })
    items: PatientResponseDto[];

    @ApiProperty({ example: 'eyJwZXJzb25faWQiOjEyM30=', required: false })
    nextCursor?: string;
}

