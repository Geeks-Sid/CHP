import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export enum DiagnosisType {
    CHRONIC = 32817,
    ACUTE = 32827,
    EMERGENCY = 32828,
    PRINCIPAL = 32879,
    PROVISIONAL = 32880,
}

export enum DiagnosisCategory {
    PRIMARY = 'Primary',
    ADDITIONAL = 'Additional',
}

export class CreateDiagnosisDto {
    @ApiProperty({
        description: 'Patient person ID',
        example: 123,
    })
    @IsInt()
    @Min(1)
    person_id: number;

    @ApiProperty({
        description: 'ICD-10 condition concept ID',
        example: 440383,
    })
    @IsInt()
    @Min(1)
    condition_concept_id: number;

    @ApiProperty({
        description: 'Condition start date (YYYY-MM-DD)',
        example: '2024-01-15',
    })
    @IsDateString()
    condition_start_date: string;

    @ApiProperty({
        description: 'Condition start datetime (ISO 8601)',
        example: '2024-01-15T10:00:00Z',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    condition_start_datetime?: string;

    @ApiProperty({
        description: 'Condition end date (YYYY-MM-DD) - null for active conditions',
        example: '2024-02-15',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    condition_end_date?: string;

    @ApiProperty({
        description: 'Condition end datetime (ISO 8601)',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    condition_end_datetime?: string;

    @ApiProperty({
        description: 'Diagnosis type concept ID (Chronic=32817, Acute=32827, Emergency=32828, Principal=32879, Provisional=32880)',
        example: 32827,
    })
    @IsInt()
    @Min(1)
    condition_type_concept_id: number;

    @ApiProperty({
        description: 'Condition status concept ID (Active=32902, Resolved=32903, Inactive=32904)',
        example: 32902,
        required: false,
    })
    @IsOptional()
    @IsInt()
    condition_status_concept_id?: number;

    @ApiProperty({
        description: 'Stop reason',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    stop_reason?: string;

    @ApiProperty({
        description: 'Provider user ID (doctor who made diagnosis)',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsOptional()
    @IsUUID()
    provider_id?: string;

    @ApiProperty({
        description: 'Visit occurrence ID (link to visit/appointment)',
        example: 456,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    visit_occurrence_id?: number;

    @ApiProperty({
        description: 'Original diagnosis text if not from vocabulary',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    condition_source_value?: string;

    @ApiProperty({
        description: 'Diagnosis category',
        enum: DiagnosisCategory,
        example: 'Primary',
        required: false,
    })
    @IsOptional()
    @IsEnum(DiagnosisCategory)
    diagnosis_category?: DiagnosisCategory;

    @ApiProperty({
        description: 'Is this the principal diagnosis for the visit',
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    is_principal_diagnosis?: boolean;

    @ApiProperty({
        description: 'Additional notes',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}

