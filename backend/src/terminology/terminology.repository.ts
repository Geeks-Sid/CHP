import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface Concept {
    concept_id: number;
    concept_name: string;
    vocabulary_id: string;
    concept_code: string;
    domain_id?: string;
    concept_class_id?: string;
}

export interface ConceptSearchFilters {
    q?: string; // Text search query
    code?: string; // Exact concept code
    system?: string; // Vocabulary system (SNOMED, ICD10, RXNORM, LOINC)
    vocabulary_id?: string; // Direct vocabulary ID
    limit?: number;
    cursor?: string;
}

export interface ConceptBatchRequest {
    concept_ids?: number[];
    concept_codes?: string[];
    vocabulary_id?: string;
}

/**
 * Terminology Repository
 * Handles all database operations for concepts and vocabulary
 * Supports text search using trigram (GIN index)
 */
@Injectable()
export class TerminologyRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Search concepts with filters
     * Supports text search, code lookup, and vocabulary filtering
     */
    async searchConcepts(filters: ConceptSearchFilters): Promise<{
        concepts: Concept[];
        nextCursor?: string;
    }> {
        const limit = Math.min(filters.limit || 20, 100);
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Cursor-based pagination
        if (filters.cursor) {
            try {
                const decoded = Buffer.from(filters.cursor, 'base64').toString('utf-8');
                const cursorData = JSON.parse(decoded);
                conditions.push(`concept_id > $${paramIndex++}`);
                params.push(cursorData.concept_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Text search using ILIKE (trigram index supports this)
        if (filters.q) {
            // Use ILIKE for text search (GIN trigram index will be used)
            conditions.push(`concept_name ILIKE $${paramIndex}`);
            params.push(`%${filters.q}%`);
            paramIndex++;
        }

        // Exact code match
        if (filters.code) {
            conditions.push(`concept_code = $${paramIndex++}`);
            params.push(filters.code);
        }

        // Vocabulary system mapping (SNOMED, ICD10, RXNORM, LOINC)
        if (filters.system) {
            const vocabularyMap: Record<string, string> = {
                SNOMED: 'SNOMED',
                ICD10: 'ICD10CM', // ICD10CM is the standard, adjust as needed
                RXNORM: 'RxNorm',
                LOINC: 'LOINC',
            };

            const vocabularyId = vocabularyMap[filters.system.toUpperCase()];
            if (vocabularyId) {
                conditions.push(`vocabulary_id = $${paramIndex++}`);
                params.push(vocabularyId);
            }
        }

        // Direct vocabulary ID
        if (filters.vocabulary_id) {
            conditions.push(`vocabulary_id = $${paramIndex++}`);
            params.push(filters.vocabulary_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Order by concept_id (trigram index will optimize ILIKE queries)
        const orderBy = 'ORDER BY concept_id ASC';

        // Get concepts (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Concept>(
            `SELECT concept_id, concept_name, vocabulary_id, concept_code,
              domain_id, concept_class_id
       FROM concept
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const concepts = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && concepts.length > 0) {
            const lastConcept = concepts[concepts.length - 1];
            const cursorData = {
                concept_id: lastConcept.concept_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            concepts,
            nextCursor,
        };
    }

    /**
     * Get concepts by IDs
     */
    async getConceptsByIds(conceptIds: number[]): Promise<Concept[]> {
        if (conceptIds.length === 0) {
            return [];
        }

        const placeholders = conceptIds.map((_, i) => `$${i + 1}`).join(', ');
        const { rows } = await this.databaseService.query<Concept>(
            `SELECT concept_id, concept_name, vocabulary_id, concept_code,
              domain_id, concept_class_id
       FROM concept
       WHERE concept_id IN (${placeholders})
       ORDER BY concept_id ASC`,
            conceptIds,
        );

        return rows;
    }

    /**
     * Get concepts by codes and vocabulary
     */
    async getConceptsByCodes(
        codes: string[],
        vocabularyId?: string,
    ): Promise<Concept[]> {
        if (codes.length === 0) {
            return [];
        }

        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const placeholders = codes.map((_, i) => `$${paramIndex++}`).join(', ');
        conditions.push(`concept_code IN (${placeholders})`);
        params.push(...codes);

        if (vocabularyId) {
            conditions.push(`vocabulary_id = $${paramIndex++}`);
            params.push(vocabularyId);
        }

        const { rows } = await this.databaseService.query<Concept>(
            `SELECT concept_id, concept_name, vocabulary_id, concept_code,
              domain_id, concept_class_id
       FROM concept
       WHERE ${conditions.join(' AND ')}
       ORDER BY concept_id ASC`,
            params,
        );

        return rows;
    }

    /**
     * Batch lookup concepts by IDs or codes
     */
    async batchLookup(request: ConceptBatchRequest): Promise<Concept[]> {
        if (request.concept_ids && request.concept_ids.length > 0) {
            return this.getConceptsByIds(request.concept_ids);
        }

        if (request.concept_codes && request.concept_codes.length > 0) {
            return this.getConceptsByCodes(request.concept_codes, request.vocabulary_id);
        }

        return [];
    }
}

