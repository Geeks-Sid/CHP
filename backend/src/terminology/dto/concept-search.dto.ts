import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ConceptSearchQueryDto {
    @ApiProperty({
        description: 'Text search query (searches concept_name)',
        example: 'diabetes',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    q?: string;

    @ApiProperty({
        description: 'Exact concept code',
        example: '44054006',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    code?: string;

    @ApiProperty({
        description: 'Vocabulary system (SNOMED, ICD10, RXNORM, LOINC)',
        example: 'SNOMED',
        enum: ['SNOMED', 'ICD10', 'RXNORM', 'LOINC'],
        required: false,
    })
    @IsOptional()
    @IsString()
    system?: string;

    @ApiProperty({
        description: 'Vocabulary ID (e.g., SNOMED, ICD10CM, RxNorm, LOINC)',
        example: 'SNOMED',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(20)
    vocabulary_id?: string;

    @ApiProperty({
        description: 'Items per page (max 100)',
        example: 20,
        required: false,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @ApiProperty({
        description: 'Pagination cursor',
        example: 'eyJjb25jZXB0X2lkIjoxMjN9',
        required: false,
    })
    @IsOptional()
    @IsString()
    cursor?: string;
}

