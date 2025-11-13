import { Injectable } from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import { Concept, ConceptBatchRequest, TerminologyRepository } from './terminology.repository';

/**
 * Terminology Service
 * Business logic for terminology/concept management
 * Supports optional caching (Redis can be added later)
 */
@Injectable()
export class TerminologyService {
    constructor(private readonly terminologyRepository: TerminologyRepository) { }

    /**
     * Search concepts with filters
     * Supports text search, code lookup, and vocabulary filtering
     */
    async searchConcepts(params: {
        q?: string;
        code?: string;
        system?: string;
        vocabulary_id?: string;
        limit?: number;
        cursor?: string;
    }): Promise<{
        items: Concept[];
        nextCursor?: string;
    }> {
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page

        // Normalize system to vocabulary_id if provided
        let vocabularyId = params.vocabulary_id;
        if (params.system && !vocabularyId) {
            const vocabularyMap: Record<string, string> = {
                SNOMED: 'SNOMED',
                ICD10: 'ICD10CM',
                RXNORM: 'RxNorm',
                LOINC: 'LOINC',
            };
            vocabularyId = vocabularyMap[params.system.toUpperCase()];
        }

        const result = await this.terminologyRepository.searchConcepts({
            q: params.q,
            code: params.code,
            vocabulary_id: vocabularyId,
            limit,
            cursor: params.cursor,
        });

        logger.debug(
            { count: result.concepts.length, filters: params },
            'Concepts searched',
        );

        return {
            items: result.concepts,
            nextCursor: result.nextCursor,
        };
    }

    /**
     * Batch lookup concepts by IDs or codes
     */
    async batchLookup(request: ConceptBatchRequest): Promise<Concept[]> {
        if (!request.concept_ids && !request.concept_codes) {
            return [];
        }

        // Validate input
        if (request.concept_ids && request.concept_ids.length > 1000) {
            throw new Error('Maximum 1000 concept IDs allowed per batch request');
        }

        if (request.concept_codes && request.concept_codes.length > 1000) {
            throw new Error('Maximum 1000 concept codes allowed per batch request');
        }

        const concepts = await this.terminologyRepository.batchLookup(request);

        logger.debug(
            { count: concepts.length, requestType: request.concept_ids ? 'ids' : 'codes' },
            'Concepts batch looked up',
        );

        return concepts;
    }
}

