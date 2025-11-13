import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum VisitType {
    OPD = 'OPD',
    IPD = 'IPD',
    ER = 'ER',
}

export class CreateVisitDto {
    @ApiProperty({
        description: 'Patient person ID',
        example: 123,
    })
    @IsInt()
    @Min(1)
    person_id: number;

    @ApiProperty({
        description: 'Visit concept ID (required by database)',
        example: 9201,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    visit_concept_id?: number;

    @ApiProperty({
        description: 'Visit type',
        enum: VisitType,
        example: 'OPD',
    })
    @IsEnum(VisitType)
    visit_type: VisitType;

    @ApiProperty({
        description: 'Visit start date/time (ISO 8601)',
        example: '2024-01-15T10:00:00Z',
    })
    @IsDateString()
    visit_start: string;

    @ApiProperty({
        description: 'Visit end date/time (ISO 8601)',
        example: '2024-01-15T11:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    visit_end?: string;

    @ApiProperty({
        description: 'Department ID',
        example: 5,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    department_id?: number;

    @ApiProperty({
        description: 'Provider user ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    provider_id?: string;

    @ApiProperty({
        description: 'Visit reason',
        example: 'Routine checkup',
        required: false,
    })
    @IsOptional()
    @IsString()
    reason?: string;
}

