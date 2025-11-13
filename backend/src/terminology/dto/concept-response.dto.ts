import { ApiProperty } from '@nestjs/swagger';

export class ConceptResponseDto {
    @ApiProperty({ example: 44054006 })
    concept_id: number;

    @ApiProperty({ example: 'Diabetes mellitus' })
    concept_name: string;

    @ApiProperty({ example: 'SNOMED' })
    vocabulary_id: string;

    @ApiProperty({ example: '44054006' })
    concept_code: string;

    @ApiProperty({ example: 'Condition', required: false })
    domain_id?: string;

    @ApiProperty({ example: 'Clinical Finding', required: false })
    concept_class_id?: string;
}

export class ConceptListResponseDto {
    @ApiProperty({ type: [ConceptResponseDto] })
    items: ConceptResponseDto[];

    @ApiProperty({ example: 'eyJjb25jZXB0X2lkIjoxMjN9', required: false })
    nextCursor?: string;
}

export class ConceptBatchRequestDto {
    @ApiProperty({
        description: 'Concept IDs to lookup',
        example: [44054006, 201820],
        required: false,
    })
    concept_ids?: number[];

    @ApiProperty({
        description: 'Concept codes to lookup',
        example: ['44054006', '201820'],
        required: false,
    })
    concept_codes?: string[];

    @ApiProperty({
        description: 'Vocabulary ID (required when using concept_codes)',
        example: 'SNOMED',
        required: false,
    })
    vocabulary_id?: string;
}

