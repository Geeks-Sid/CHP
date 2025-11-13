import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreateVisitData {
    person_id: number;
    visit_concept_id: number;
    visit_start: Date;
    visit_end?: Date;
    visit_type: 'OPD' | 'IPD' | 'ER';
    department_id?: number;
    provider_id?: string;
    reason?: string;
}

export interface UpdateVisitData {
    visit_concept_id?: number;
    visit_start?: Date;
    visit_end?: Date;
    visit_type?: 'OPD' | 'IPD' | 'ER';
    department_id?: number;
    provider_id?: string;
    reason?: string;
}

export interface Visit {
    visit_occurrence_id: number;
    person_id: number;
    visit_concept_id: number;
    visit_start: Date;
    visit_end?: Date;
    visit_type: 'OPD' | 'IPD' | 'ER';
    department_id?: number;
    provider_id?: string;
    reason?: string;
    visit_number: string;
    created_at: Date;
    updated_at: Date;
}

export interface VisitSearchFilters {
    person_id?: number;
    provider_id?: string;
    type?: 'OPD' | 'IPD' | 'ER';
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    cursor?: string;
}

/**
 * Visits Repository
 * Handles all database operations for visits
 * Uses advisory locks for visit number generation to prevent race conditions
 */
@Injectable()
export class VisitsRepository {
    private readonly VISIT_LOCK_KEY = 1000001; // Advisory lock key for visit number generation

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Generate visit number using advisory lock to prevent race conditions
     * Format: V-YYYY-NNNNNN
     */
    private async generateVisitNumber(client: PoolClient): Promise<string> {
        // Use advisory lock to ensure atomic visit number generation
        const lockResult = await client.query(
            `SELECT pg_try_advisory_xact_lock($1) as locked`,
            [this.VISIT_LOCK_KEY],
        );

        if (!lockResult.rows[0].locked) {
            throw new Error('Failed to acquire lock for visit number generation');
        }

        // Get next sequence value
        const seqResult = await client.query(`SELECT nextval('seq_visit') AS n`);
        const sequenceNumber = seqResult.rows[0].n;

        // Format: V-YYYY-NNNNNN
        const year = new Date().getUTCFullYear();
        const visitNumber = `V-${year}-${String(sequenceNumber).padStart(6, '0')}`;

        return visitNumber;
    }

    /**
     * Create a new visit
     * Uses transaction and advisory lock for visit number generation
     */
    async createVisit(data: CreateVisitData): Promise<Visit> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Generate visit number with advisory lock
            const visitNumber = await this.generateVisitNumber(client);

            // Insert visit
            const { rows } = await client.query<Visit>(
                `INSERT INTO visit_occurrence (
          person_id, visit_concept_id, visit_start, visit_end,
          visit_type, department_id, provider_id, reason, visit_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
                  visit_type, department_id, provider_id, reason, visit_number,
                  created_at, updated_at`,
                [
                    data.person_id,
                    data.visit_concept_id,
                    data.visit_start,
                    data.visit_end || null,
                    data.visit_type,
                    data.department_id || null,
                    data.provider_id || null,
                    data.reason || null,
                    visitNumber,
                ],
            );

            logger.debug({ visitId: rows[0].visit_occurrence_id, visitNumber }, 'Visit created');
            return rows[0];
        });
    }

    /**
     * Find visit by ID
     */
    async findById(visitId: number): Promise<Visit | null> {
        const { rows } = await this.databaseService.query<Visit>(
            `SELECT visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
              visit_type, department_id, provider_id, reason, visit_number,
              created_at, updated_at
       FROM visit_occurrence
       WHERE visit_occurrence_id = $1`,
            [visitId],
        );

        return rows[0] || null;
    }

    /**
     * Find visit by visit number
     */
    async findByVisitNumber(visitNumber: string): Promise<Visit | null> {
        const { rows } = await this.databaseService.query<Visit>(
            `SELECT visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
              visit_type, department_id, provider_id, reason, visit_number,
              created_at, updated_at
       FROM visit_occurrence
       WHERE visit_number = $1`,
            [visitNumber],
        );

        return rows[0] || null;
    }

    /**
     * Check for overlapping inpatient visits for a patient
     * Returns true if there's an overlapping IPD visit
     */
    async hasOverlappingInpatientVisit(
        personId: number,
        visitStart: Date,
        visitEnd: Date | null,
        excludeVisitId?: number,
    ): Promise<boolean> {
        let query = `
      SELECT 1 FROM visit_occurrence
      WHERE person_id = $1
        AND visit_type = 'IPD'
        AND (
          (visit_end IS NULL)
          OR (visit_start <= $3 AND (visit_end >= $2 OR visit_end IS NULL))
          OR ($2 <= visit_end AND $3 >= visit_start)
        )
    `;

        const params: any[] = [personId, visitStart, visitEnd || visitStart];

        if (excludeVisitId) {
            query += ` AND visit_occurrence_id != $4`;
            params.push(excludeVisitId);
        }

        query += ` LIMIT 1`;

        const { rows } = await this.databaseService.query(query, params);
        return rows.length > 0;
    }

    /**
     * Update visit
     */
    async updateVisit(visitId: number, data: UpdateVisitData): Promise<Visit> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.visit_concept_id !== undefined) {
                updates.push(`visit_concept_id = $${paramIndex++}`);
                values.push(data.visit_concept_id);
            }

            if (data.visit_start !== undefined) {
                updates.push(`visit_start = $${paramIndex++}`);
                values.push(data.visit_start);
            }

            if (data.visit_end !== undefined) {
                updates.push(`visit_end = $${paramIndex++}`);
                values.push(data.visit_end || null);
            }

            if (data.visit_type !== undefined) {
                updates.push(`visit_type = $${paramIndex++}`);
                values.push(data.visit_type);
            }

            if (data.department_id !== undefined) {
                updates.push(`department_id = $${paramIndex++}`);
                values.push(data.department_id || null);
            }

            if (data.provider_id !== undefined) {
                updates.push(`provider_id = $${paramIndex++}`);
                values.push(data.provider_id || null);
            }

            if (data.reason !== undefined) {
                updates.push(`reason = $${paramIndex++}`);
                values.push(data.reason || null);
            }

            if (updates.length === 0) {
                // No updates, just return existing visit
                const visit = await this.findById(visitId);
                if (!visit) {
                    throw new Error('VISIT_NOT_FOUND');
                }
                return visit;
            }

            values.push(visitId);

            const { rows } = await client.query<Visit>(
                `UPDATE visit_occurrence
         SET ${updates.join(', ')}
         WHERE visit_occurrence_id = $${paramIndex}
         RETURNING visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
                   visit_type, department_id, provider_id, reason, visit_number,
                   created_at, updated_at`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('VISIT_NOT_FOUND');
            }

            logger.debug({ visitId }, 'Visit updated');
            return rows[0];
        });
    }

    /**
     * Search visits with filters
     * Supports person, provider, type, date range, and pagination
     */
    async searchVisits(filters: VisitSearchFilters): Promise<{
        visits: Visit[];
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
                conditions.push(`visit_occurrence_id < $${paramIndex++}`);
                params.push(cursorData.visit_occurrence_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Filter by person
        if (filters.person_id) {
            conditions.push(`person_id = $${paramIndex++}`);
            params.push(filters.person_id);
        }

        // Filter by provider
        if (filters.provider_id) {
            conditions.push(`provider_id = $${paramIndex++}`);
            params.push(filters.provider_id);
        }

        // Filter by type
        if (filters.type) {
            conditions.push(`visit_type = $${paramIndex++}`);
            params.push(filters.type);
        }

        // Filter by date range
        if (filters.date_from) {
            conditions.push(`visit_start >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`(visit_end IS NULL OR visit_end <= $${paramIndex++})`);
            params.push(filters.date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get visits (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Visit>(
            `SELECT visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
              visit_type, department_id, provider_id, reason, visit_number,
              created_at, updated_at
       FROM visit_occurrence
       ${whereClause}
       ORDER BY visit_occurrence_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const visits = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && visits.length > 0) {
            const lastVisit = visits[visits.length - 1];
            const cursorData = {
                visit_occurrence_id: lastVisit.visit_occurrence_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            visits,
            nextCursor,
        };
    }

    /**
     * Get active inpatient visits for a patient
     */
    async getActiveInpatientVisits(personId: number): Promise<Visit[]> {
        const { rows } = await this.databaseService.query<Visit>(
            `SELECT visit_occurrence_id, person_id, visit_concept_id, visit_start, visit_end,
              visit_type, department_id, provider_id, reason, visit_number,
              created_at, updated_at
       FROM visit_occurrence
       WHERE person_id = $1
         AND visit_type = 'IPD'
         AND visit_end IS NULL
       ORDER BY visit_start DESC`,
            [personId],
        );

        return rows;
    }
}

