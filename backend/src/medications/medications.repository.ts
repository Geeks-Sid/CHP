import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreateMedicationData {
    person_id: number;
    drug_concept_id: number;
    drug_exposure_start: Date;
    drug_exposure_end?: Date;
    drug_type_concept_id: number;
    quantity?: number;
    visit_occurrence_id?: number;
    instructions?: string;
}

export interface UpdateMedicationData {
    drug_concept_id?: number;
    drug_exposure_start?: Date;
    drug_exposure_end?: Date;
    drug_type_concept_id?: number;
    quantity?: number;
    visit_occurrence_id?: number;
    instructions?: string;
}

export interface Medication {
    drug_exposure_id: number;
    person_id: number;
    drug_concept_id: number;
    drug_exposure_start: Date;
    drug_exposure_end?: Date;
    drug_type_concept_id: number;
    quantity?: number;
    visit_occurrence_id?: number;
    instructions?: string;
    created_at: Date;
    updated_at: Date;
}

export interface MedicationSearchFilters {
    person_id?: number;
    visit_occurrence_id?: number;
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    cursor?: string;
}

/**
 * Medications Repository
 * Handles all database operations for medications (drug_exposure table)
 * Note: stop_reason field is not in the current schema but can be added later if needed
 */
@Injectable()
export class MedicationsRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Create a new medication (drug exposure)
     * Uses transaction for atomicity
     */
    async createMedication(data: CreateMedicationData): Promise<Medication> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Insert medication
            const { rows } = await client.query<Medication>(
                `INSERT INTO drug_exposure (
          person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
          drug_type_concept_id, quantity, visit_occurrence_id, instructions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
                  drug_type_concept_id, quantity, visit_occurrence_id, instructions,
                  created_at, updated_at`,
                [
                    data.person_id,
                    data.drug_concept_id,
                    data.drug_exposure_start,
                    data.drug_exposure_end || null,
                    data.drug_type_concept_id,
                    data.quantity || null,
                    data.visit_occurrence_id || null,
                    data.instructions || null,
                ],
            );

            logger.debug({ medicationId: rows[0].drug_exposure_id, personId: data.person_id }, 'Medication created');
            return rows[0];
        });
    }

    /**
     * Find medication by ID
     */
    async findById(medicationId: number): Promise<Medication | null> {
        const { rows } = await this.databaseService.query<Medication>(
            `SELECT drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
              drug_type_concept_id, quantity, visit_occurrence_id, instructions,
              created_at, updated_at
       FROM drug_exposure
       WHERE drug_exposure_id = $1`,
            [medicationId],
        );

        return rows[0] || null;
    }

    /**
     * Update medication
     */
    async updateMedication(medicationId: number, data: UpdateMedicationData): Promise<Medication> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.drug_concept_id !== undefined) {
                updates.push(`drug_concept_id = $${paramIndex++}`);
                values.push(data.drug_concept_id);
            }

            if (data.drug_exposure_start !== undefined) {
                updates.push(`drug_exposure_start = $${paramIndex++}`);
                values.push(data.drug_exposure_start);
            }

            if (data.drug_exposure_end !== undefined) {
                updates.push(`drug_exposure_end = $${paramIndex++}`);
                values.push(data.drug_exposure_end || null);
            }

            if (data.drug_type_concept_id !== undefined) {
                updates.push(`drug_type_concept_id = $${paramIndex++}`);
                values.push(data.drug_type_concept_id);
            }

            if (data.quantity !== undefined) {
                updates.push(`quantity = $${paramIndex++}`);
                values.push(data.quantity || null);
            }

            if (data.visit_occurrence_id !== undefined) {
                updates.push(`visit_occurrence_id = $${paramIndex++}`);
                values.push(data.visit_occurrence_id || null);
            }

            if (data.instructions !== undefined) {
                updates.push(`instructions = $${paramIndex++}`);
                values.push(data.instructions || null);
            }

            if (updates.length === 0) {
                // No updates, just return existing medication
                const medication = await this.findById(medicationId);
                if (!medication) {
                    throw new Error('MEDICATION_NOT_FOUND');
                }
                return medication;
            }

            values.push(medicationId);

            const { rows } = await client.query<Medication>(
                `UPDATE drug_exposure
         SET ${updates.join(', ')}
         WHERE drug_exposure_id = $${paramIndex}
         RETURNING drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
                   drug_type_concept_id, quantity, visit_occurrence_id, instructions,
                   created_at, updated_at`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('MEDICATION_NOT_FOUND');
            }

            logger.debug({ medicationId }, 'Medication updated');
            return rows[0];
        });
    }

    /**
     * Search medications with filters
     * Supports person, visit, date range, and pagination
     */
    async searchMedications(filters: MedicationSearchFilters): Promise<{
        medications: Medication[];
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
                conditions.push(`drug_exposure_id < $${paramIndex++}`);
                params.push(cursorData.drug_exposure_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Filter by person
        if (filters.person_id) {
            conditions.push(`person_id = $${paramIndex++}`);
            params.push(filters.person_id);
        }

        // Filter by visit
        if (filters.visit_occurrence_id) {
            conditions.push(`visit_occurrence_id = $${paramIndex++}`);
            params.push(filters.visit_occurrence_id);
        }

        // Filter by date range (based on drug_exposure_start)
        if (filters.date_from) {
            conditions.push(`drug_exposure_start >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`drug_exposure_start <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get medications (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Medication>(
            `SELECT drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
              drug_type_concept_id, quantity, visit_occurrence_id, instructions,
              created_at, updated_at
       FROM drug_exposure
       ${whereClause}
       ORDER BY drug_exposure_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const medications = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && medications.length > 0) {
            const lastMedication = medications[medications.length - 1];
            const cursorData = {
                drug_exposure_id: lastMedication.drug_exposure_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            medications,
            nextCursor,
        };
    }
}

