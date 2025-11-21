import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreateDiagnosisData {
    person_id: number;
    condition_concept_id: number;
    condition_start_date: Date;
    condition_start_datetime?: Date;
    condition_end_date?: Date;
    condition_end_datetime?: Date;
    condition_type_concept_id: number;
    condition_status_concept_id?: number;
    stop_reason?: string;
    provider_id?: string;
    visit_occurrence_id?: number;
    condition_source_value?: string;
    diagnosis_category?: string;
    is_principal_diagnosis?: boolean;
    notes?: string;
    created_by?: string;
}

export interface UpdateDiagnosisData {
    condition_concept_id?: number;
    condition_start_date?: Date;
    condition_start_datetime?: Date;
    condition_end_date?: Date;
    condition_end_datetime?: Date;
    condition_type_concept_id?: number;
    condition_status_concept_id?: number;
    stop_reason?: string;
    provider_id?: string;
    visit_occurrence_id?: number;
    condition_source_value?: string;
    diagnosis_category?: string;
    is_principal_diagnosis?: boolean;
    notes?: string;
    updated_by?: string;
}

export interface Diagnosis {
    condition_occurrence_id: number;
    person_id: number;
    condition_concept_id: number;
    condition_start_date: Date;
    condition_start_datetime?: Date;
    condition_end_date?: Date;
    condition_end_datetime?: Date;
    condition_type_concept_id: number;
    condition_status_concept_id?: number;
    stop_reason?: string;
    provider_id?: string;
    visit_occurrence_id?: number;
    visit_detail_id?: number;
    condition_source_value?: string;
    condition_source_concept_id?: number;
    condition_status_source_value?: string;
    diagnosis_category?: string;
    is_principal_diagnosis: boolean;
    notes?: string;
    created_at: Date;
    updated_at: Date;
    created_by?: string;
    updated_by?: string;
    // Joined fields
    condition_concept_name?: string;
    condition_concept_code?: string;
    condition_type_name?: string;
    condition_status_name?: string;
    provider_name?: string;
    visit_number?: string;
}

export interface DiagnosisSearchFilters {
    person_id?: number;
    visit_occurrence_id?: number;
    active_only?: boolean;
    date_from?: Date;
    date_to?: Date;
    condition_type_concept_id?: number;
    is_principal_diagnosis?: boolean;
    search?: string;
    limit?: number;
    cursor?: string;
}

/**
 * Diagnoses Repository
 * Handles all database operations for diagnoses (condition_occurrence table)
 */
@Injectable()
export class DiagnosesRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Create a new diagnosis
     * Uses transaction for atomicity
     * Handles principal diagnosis logic
     */
    async createDiagnosis(data: CreateDiagnosisData): Promise<Diagnosis> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // If this is marked as principal diagnosis, unset any existing principal for the visit
            if (data.is_principal_diagnosis && data.visit_occurrence_id) {
                await client.query(
                    `UPDATE condition_occurrence 
                     SET is_principal_diagnosis = false 
                     WHERE visit_occurrence_id = $1 AND is_principal_diagnosis = true`,
                    [data.visit_occurrence_id],
                );
            }

            // Insert diagnosis
            const { rows } = await client.query<Diagnosis>(
                `INSERT INTO condition_occurrence (
          person_id, condition_concept_id, condition_start_date, condition_start_datetime,
          condition_end_date, condition_end_datetime, condition_type_concept_id,
          condition_status_concept_id, stop_reason, provider_id, visit_occurrence_id,
          condition_source_value, diagnosis_category, is_principal_diagnosis, notes,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING condition_occurrence_id, person_id, condition_concept_id, condition_start_date,
                  condition_start_datetime, condition_end_date, condition_end_datetime,
                  condition_type_concept_id, condition_status_concept_id, stop_reason,
                  provider_id, visit_occurrence_id, visit_detail_id, condition_source_value,
                  condition_source_concept_id, condition_status_source_value, diagnosis_category,
                  is_principal_diagnosis, notes, created_at, updated_at, created_by, updated_by`,
                [
                    data.person_id,
                    data.condition_concept_id,
                    data.condition_start_date,
                    data.condition_start_datetime || null,
                    data.condition_end_date || null,
                    data.condition_end_datetime || null,
                    data.condition_type_concept_id,
                    data.condition_status_concept_id || null,
                    data.stop_reason || null,
                    data.provider_id || null,
                    data.visit_occurrence_id || null,
                    data.condition_source_value || null,
                    data.diagnosis_category || null,
                    data.is_principal_diagnosis || false,
                    data.notes || null,
                    data.created_by || null,
                ],
            );

            logger.debug(
                { conditionId: rows[0].condition_occurrence_id, personId: data.person_id },
                'Diagnosis created',
            );
            return rows[0];
        });
    }

    /**
     * Find diagnosis by ID with joined data
     */
    async findById(conditionId: number): Promise<Diagnosis | null> {
        const { rows } = await this.databaseService.query<Diagnosis>(
            `SELECT 
              co.condition_occurrence_id, co.person_id, co.condition_concept_id,
              co.condition_start_date, co.condition_start_datetime,
              co.condition_end_date, co.condition_end_datetime,
              co.condition_type_concept_id, co.condition_status_concept_id,
              co.stop_reason, co.provider_id, co.visit_occurrence_id,
              co.visit_detail_id, co.condition_source_value,
              co.condition_source_concept_id, co.condition_status_source_value,
              co.diagnosis_category, co.is_principal_diagnosis, co.notes,
              co.created_at, co.updated_at, co.created_by, co.updated_by,
              c.concept_name as condition_concept_name,
              c.concept_code as condition_concept_code,
              ct.concept_name as condition_type_name,
              cs.concept_name as condition_status_name,
              u.first_name || ' ' || u.last_name as provider_name,
              vo.visit_number
       FROM condition_occurrence co
       LEFT JOIN concept c ON co.condition_concept_id = c.concept_id
       LEFT JOIN concept ct ON co.condition_type_concept_id = ct.concept_id
       LEFT JOIN concept cs ON co.condition_status_concept_id = cs.concept_id
       LEFT JOIN users u ON co.provider_id = u.user_id
       LEFT JOIN visit_occurrence vo ON co.visit_occurrence_id = vo.visit_occurrence_id
       WHERE co.condition_occurrence_id = $1`,
            [conditionId],
        );

        return rows[0] || null;
    }

    /**
     * Update diagnosis
     * Handles principal diagnosis logic
     */
    async updateDiagnosis(conditionId: number, data: UpdateDiagnosisData): Promise<Diagnosis> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Get existing diagnosis to check visit_id
            const existing = await this.findById(conditionId);
            if (!existing) {
                throw new Error('DIAGNOSIS_NOT_FOUND');
            }

            // If setting as principal diagnosis, unset any existing principal for the visit
            if (data.is_principal_diagnosis && existing.visit_occurrence_id) {
                await client.query(
                    `UPDATE condition_occurrence 
                     SET is_principal_diagnosis = false 
                     WHERE visit_occurrence_id = $1 
                       AND is_principal_diagnosis = true 
                       AND condition_occurrence_id != $2`,
                    [existing.visit_occurrence_id, conditionId],
                );
            }

            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.condition_concept_id !== undefined) {
                updates.push(`condition_concept_id = $${paramIndex++}`);
                values.push(data.condition_concept_id);
            }

            if (data.condition_start_date !== undefined) {
                updates.push(`condition_start_date = $${paramIndex++}`);
                values.push(data.condition_start_date);
            }

            if (data.condition_start_datetime !== undefined) {
                updates.push(`condition_start_datetime = $${paramIndex++}`);
                values.push(data.condition_start_datetime || null);
            }

            if (data.condition_end_date !== undefined) {
                updates.push(`condition_end_date = $${paramIndex++}`);
                values.push(data.condition_end_date || null);
            }

            if (data.condition_end_datetime !== undefined) {
                updates.push(`condition_end_datetime = $${paramIndex++}`);
                values.push(data.condition_end_datetime || null);
            }

            if (data.condition_type_concept_id !== undefined) {
                updates.push(`condition_type_concept_id = $${paramIndex++}`);
                values.push(data.condition_type_concept_id);
            }

            if (data.condition_status_concept_id !== undefined) {
                updates.push(`condition_status_concept_id = $${paramIndex++}`);
                values.push(data.condition_status_concept_id || null);
            }

            if (data.stop_reason !== undefined) {
                updates.push(`stop_reason = $${paramIndex++}`);
                values.push(data.stop_reason || null);
            }

            if (data.provider_id !== undefined) {
                updates.push(`provider_id = $${paramIndex++}`);
                values.push(data.provider_id || null);
            }

            if (data.visit_occurrence_id !== undefined) {
                updates.push(`visit_occurrence_id = $${paramIndex++}`);
                values.push(data.visit_occurrence_id || null);
            }

            if (data.condition_source_value !== undefined) {
                updates.push(`condition_source_value = $${paramIndex++}`);
                values.push(data.condition_source_value || null);
            }

            if (data.diagnosis_category !== undefined) {
                updates.push(`diagnosis_category = $${paramIndex++}`);
                values.push(data.diagnosis_category || null);
            }

            if (data.is_principal_diagnosis !== undefined) {
                updates.push(`is_principal_diagnosis = $${paramIndex++}`);
                values.push(data.is_principal_diagnosis);
            }

            if (data.notes !== undefined) {
                updates.push(`notes = $${paramIndex++}`);
                values.push(data.notes || null);
            }

            if (data.updated_by !== undefined) {
                updates.push(`updated_by = $${paramIndex++}`);
                values.push(data.updated_by);
            }

            if (updates.length === 0) {
                // No updates, just return existing diagnosis
                return existing;
            }

            values.push(conditionId);

            const { rows } = await client.query<Diagnosis>(
                `UPDATE condition_occurrence
         SET ${updates.join(', ')}
         WHERE condition_occurrence_id = $${paramIndex}
         RETURNING condition_occurrence_id, person_id, condition_concept_id,
                   condition_start_date, condition_start_datetime,
                   condition_end_date, condition_end_datetime,
                   condition_type_concept_id, condition_status_concept_id,
                   stop_reason, provider_id, visit_occurrence_id,
                   visit_detail_id, condition_source_value,
                   condition_source_concept_id, condition_status_source_value,
                   diagnosis_category, is_principal_diagnosis, notes,
                   created_at, updated_at, created_by, updated_by`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('DIAGNOSIS_NOT_FOUND');
            }

            logger.debug({ conditionId }, 'Diagnosis updated');
            return rows[0];
        });
    }

    /**
     * Get diagnoses by person ID
     */
    async findByPersonId(personId: number, filters?: { active_only?: boolean }): Promise<Diagnosis[]> {
        const conditions: string[] = ['co.person_id = $1'];
        const params: any[] = [personId];
        let paramIndex = 2;

        if (filters?.active_only) {
            conditions.push('co.condition_end_date IS NULL');
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const { rows } = await this.databaseService.query<Diagnosis>(
            `SELECT 
              co.condition_occurrence_id, co.person_id, co.condition_concept_id,
              co.condition_start_date, co.condition_start_datetime,
              co.condition_end_date, co.condition_end_datetime,
              co.condition_type_concept_id, co.condition_status_concept_id,
              co.stop_reason, co.provider_id, co.visit_occurrence_id,
              co.visit_detail_id, co.condition_source_value,
              co.condition_source_concept_id, co.condition_status_source_value,
              co.diagnosis_category, co.is_principal_diagnosis, co.notes,
              co.created_at, co.updated_at, co.created_by, co.updated_by,
              c.concept_name as condition_concept_name,
              c.concept_code as condition_concept_code,
              ct.concept_name as condition_type_name,
              cs.concept_name as condition_status_name,
              u.first_name || ' ' || u.last_name as provider_name,
              vo.visit_number
       FROM condition_occurrence co
       LEFT JOIN concept c ON co.condition_concept_id = c.concept_id
       LEFT JOIN concept ct ON co.condition_type_concept_id = ct.concept_id
       LEFT JOIN concept cs ON co.condition_status_concept_id = cs.concept_id
       LEFT JOIN users u ON co.provider_id = u.user_id
       LEFT JOIN visit_occurrence vo ON co.visit_occurrence_id = vo.visit_occurrence_id
       ${whereClause}
       ORDER BY co.condition_start_date DESC, co.created_at DESC`,
            params,
        );

        return rows;
    }

    /**
     * Get diagnoses by visit ID
     */
    async findByVisitId(visitId: number): Promise<Diagnosis[]> {
        const { rows } = await this.databaseService.query<Diagnosis>(
            `SELECT 
              co.condition_occurrence_id, co.person_id, co.condition_concept_id,
              co.condition_start_date, co.condition_start_datetime,
              co.condition_end_date, co.condition_end_datetime,
              co.condition_type_concept_id, co.condition_status_concept_id,
              co.stop_reason, co.provider_id, co.visit_occurrence_id,
              co.visit_detail_id, co.condition_source_value,
              co.condition_source_concept_id, co.condition_status_source_value,
              co.diagnosis_category, co.is_principal_diagnosis, co.notes,
              co.created_at, co.updated_at, co.created_by, co.updated_by,
              c.concept_name as condition_concept_name,
              c.concept_code as condition_concept_code,
              ct.concept_name as condition_type_name,
              cs.concept_name as condition_status_name,
              u.first_name || ' ' || u.last_name as provider_name,
              vo.visit_number
       FROM condition_occurrence co
       LEFT JOIN concept c ON co.condition_concept_id = c.concept_id
       LEFT JOIN concept ct ON co.condition_type_concept_id = ct.concept_id
       LEFT JOIN concept cs ON co.condition_status_concept_id = cs.concept_id
       LEFT JOIN users u ON co.provider_id = u.user_id
       LEFT JOIN visit_occurrence vo ON co.visit_occurrence_id = vo.visit_occurrence_id
       WHERE co.visit_occurrence_id = $1
       ORDER BY co.is_principal_diagnosis DESC, co.condition_start_date DESC`,
            [visitId],
        );

        return rows;
    }

    /**
     * Get principal diagnosis for a visit
     */
    async getPrincipalDiagnosisForVisit(visitId: number): Promise<Diagnosis | null> {
        const { rows } = await this.databaseService.query<Diagnosis>(
            `SELECT 
              co.condition_occurrence_id, co.person_id, co.condition_concept_id,
              co.condition_start_date, co.condition_start_datetime,
              co.condition_end_date, co.condition_end_datetime,
              co.condition_type_concept_id, co.condition_status_concept_id,
              co.stop_reason, co.provider_id, co.visit_occurrence_id,
              co.visit_detail_id, co.condition_source_value,
              co.condition_source_concept_id, co.condition_status_source_value,
              co.diagnosis_category, co.is_principal_diagnosis, co.notes,
              co.created_at, co.updated_at, co.created_by, co.updated_by,
              c.concept_name as condition_concept_name,
              c.concept_code as condition_concept_code,
              ct.concept_name as condition_type_name,
              cs.concept_name as condition_status_name,
              u.first_name || ' ' || u.last_name as provider_name,
              vo.visit_number
       FROM condition_occurrence co
       LEFT JOIN concept c ON co.condition_concept_id = c.concept_id
       LEFT JOIN concept ct ON co.condition_type_concept_id = ct.concept_id
       LEFT JOIN concept cs ON co.condition_status_concept_id = cs.concept_id
       LEFT JOIN users u ON co.provider_id = u.user_id
       LEFT JOIN visit_occurrence vo ON co.visit_occurrence_id = vo.visit_occurrence_id
       WHERE co.visit_occurrence_id = $1 AND co.is_principal_diagnosis = true
       LIMIT 1`,
            [visitId],
        );

        return rows[0] || null;
    }

    /**
     * Set a diagnosis as principal for a visit
     * Unsets any existing principal diagnosis
     */
    async setPrincipalDiagnosis(conditionId: number, visitId: number): Promise<void> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Unset existing principal diagnosis for this visit
            await client.query(
                `UPDATE condition_occurrence 
                 SET is_principal_diagnosis = false 
                 WHERE visit_occurrence_id = $1 AND is_principal_diagnosis = true`,
                [visitId],
            );

            // Set this diagnosis as principal
            const { rowCount } = await client.query(
                `UPDATE condition_occurrence 
                 SET is_principal_diagnosis = true 
                 WHERE condition_occurrence_id = $1 AND visit_occurrence_id = $2`,
                [conditionId, visitId],
            );

            if (rowCount === 0) {
                throw new Error('DIAGNOSIS_NOT_FOUND_OR_NOT_IN_VISIT');
            }
        });
    }

    /**
     * Delete diagnosis
     */
    async deleteDiagnosis(conditionId: number): Promise<void> {
        const { rowCount } = await this.databaseService.query(
            `DELETE FROM condition_occurrence WHERE condition_occurrence_id = $1`,
            [conditionId],
        );

        if (rowCount === 0) {
            throw new Error('DIAGNOSIS_NOT_FOUND');
        }

        logger.debug({ conditionId }, 'Diagnosis deleted');
    }

    /**
     * Search diagnoses with filters
     */
    async searchDiagnoses(filters: DiagnosisSearchFilters): Promise<{
        diagnoses: Diagnosis[];
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
                conditions.push(`co.condition_occurrence_id < $${paramIndex++}`);
                params.push(cursorData.condition_occurrence_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Filter by person
        if (filters.person_id) {
            conditions.push(`co.person_id = $${paramIndex++}`);
            params.push(filters.person_id);
        }

        // Filter by visit
        if (filters.visit_occurrence_id) {
            conditions.push(`co.visit_occurrence_id = $${paramIndex++}`);
            params.push(filters.visit_occurrence_id);
        }

        // Filter active only
        if (filters.active_only) {
            conditions.push(`co.condition_end_date IS NULL`);
        }

        // Filter by date range
        if (filters.date_from) {
            conditions.push(`co.condition_start_date >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`co.condition_start_date <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        // Filter by type
        if (filters.condition_type_concept_id) {
            conditions.push(`co.condition_type_concept_id = $${paramIndex++}`);
            params.push(filters.condition_type_concept_id);
        }

        // Filter by principal
        if (filters.is_principal_diagnosis !== undefined) {
            conditions.push(`co.is_principal_diagnosis = $${paramIndex++}`);
            params.push(filters.is_principal_diagnosis);
        }

        // Search by concept name or code
        if (filters.search) {
            conditions.push(
                `(c.concept_name ILIKE $${paramIndex} OR c.concept_code ILIKE $${paramIndex})`,
            );
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get diagnoses (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Diagnosis>(
            `SELECT 
              co.condition_occurrence_id, co.person_id, co.condition_concept_id,
              co.condition_start_date, co.condition_start_datetime,
              co.condition_end_date, co.condition_end_datetime,
              co.condition_type_concept_id, co.condition_status_concept_id,
              co.stop_reason, co.provider_id, co.visit_occurrence_id,
              co.visit_detail_id, co.condition_source_value,
              co.condition_source_concept_id, co.condition_status_source_value,
              co.diagnosis_category, co.is_principal_diagnosis, co.notes,
              co.created_at, co.updated_at, co.created_by, co.updated_by,
              c.concept_name as condition_concept_name,
              c.concept_code as condition_concept_code,
              ct.concept_name as condition_type_name,
              cs.concept_name as condition_status_name,
              u.first_name || ' ' || u.last_name as provider_name,
              vo.visit_number
       FROM condition_occurrence co
       LEFT JOIN concept c ON co.condition_concept_id = c.concept_id
       LEFT JOIN concept ct ON co.condition_type_concept_id = ct.concept_id
       LEFT JOIN concept cs ON co.condition_status_concept_id = cs.concept_id
       LEFT JOIN users u ON co.provider_id = u.user_id
       LEFT JOIN visit_occurrence vo ON co.visit_occurrence_id = vo.visit_occurrence_id
       ${whereClause}
       ORDER BY co.condition_occurrence_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const diagnoses = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && diagnoses.length > 0) {
            const lastDiagnosis = diagnoses[diagnoses.length - 1];
            const cursorData = {
                condition_occurrence_id: lastDiagnosis.condition_occurrence_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            diagnoses,
            nextCursor,
        };
    }
}

