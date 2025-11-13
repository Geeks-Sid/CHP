import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreateProcedureData {
    person_id: number;
    procedure_concept_id: number;
    procedure_date: Date;
    procedure_type_concept_id: number;
    visit_occurrence_id?: number;
}

export interface UpdateProcedureData {
    procedure_concept_id?: number;
    procedure_date?: Date;
    procedure_type_concept_id?: number;
    visit_occurrence_id?: number;
}

export interface Procedure {
    procedure_occurrence_id: number;
    person_id: number;
    procedure_concept_id: number;
    procedure_date: Date;
    procedure_type_concept_id: number;
    visit_occurrence_id?: number;
    created_at: Date;
    updated_at: Date;
}

export interface ProcedureSearchFilters {
    person_id?: number;
    visit_occurrence_id?: number;
    date_from?: Date;
    date_to?: Date;
    limit?: number;
    cursor?: string;
}

/**
 * Procedures Repository
 * Handles all database operations for procedures (procedure_occurrence table)
 */
@Injectable()
export class ProceduresRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Create a new procedure
     * Uses transaction for atomicity
     */
    async createProcedure(data: CreateProcedureData): Promise<Procedure> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Insert procedure
            const { rows } = await client.query<Procedure>(
                `INSERT INTO procedure_occurrence (
          person_id, procedure_concept_id, procedure_date,
          procedure_type_concept_id, visit_occurrence_id
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING procedure_occurrence_id, person_id, procedure_concept_id, procedure_date,
                  procedure_type_concept_id, visit_occurrence_id,
                  created_at, updated_at`,
                [
                    data.person_id,
                    data.procedure_concept_id,
                    data.procedure_date,
                    data.procedure_type_concept_id,
                    data.visit_occurrence_id || null,
                ],
            );

            logger.debug({ procedureId: rows[0].procedure_occurrence_id, personId: data.person_id }, 'Procedure created');
            return rows[0];
        });
    }

    /**
     * Find procedure by ID
     */
    async findById(procedureId: number): Promise<Procedure | null> {
        const { rows } = await this.databaseService.query<Procedure>(
            `SELECT procedure_occurrence_id, person_id, procedure_concept_id, procedure_date,
              procedure_type_concept_id, visit_occurrence_id,
              created_at, updated_at
       FROM procedure_occurrence
       WHERE procedure_occurrence_id = $1`,
            [procedureId],
        );

        return rows[0] || null;
    }

    /**
     * Update procedure
     */
    async updateProcedure(procedureId: number, data: UpdateProcedureData): Promise<Procedure> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.procedure_concept_id !== undefined) {
                updates.push(`procedure_concept_id = $${paramIndex++}`);
                values.push(data.procedure_concept_id);
            }

            if (data.procedure_date !== undefined) {
                updates.push(`procedure_date = $${paramIndex++}`);
                values.push(data.procedure_date);
            }

            if (data.procedure_type_concept_id !== undefined) {
                updates.push(`procedure_type_concept_id = $${paramIndex++}`);
                values.push(data.procedure_type_concept_id);
            }

            if (data.visit_occurrence_id !== undefined) {
                updates.push(`visit_occurrence_id = $${paramIndex++}`);
                values.push(data.visit_occurrence_id || null);
            }

            if (updates.length === 0) {
                // No updates, just return existing procedure
                const procedure = await this.findById(procedureId);
                if (!procedure) {
                    throw new Error('PROCEDURE_NOT_FOUND');
                }
                return procedure;
            }

            values.push(procedureId);

            const { rows } = await client.query<Procedure>(
                `UPDATE procedure_occurrence
         SET ${updates.join(', ')}
         WHERE procedure_occurrence_id = $${paramIndex}
         RETURNING procedure_occurrence_id, person_id, procedure_concept_id, procedure_date,
                   procedure_type_concept_id, visit_occurrence_id,
                   created_at, updated_at`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('PROCEDURE_NOT_FOUND');
            }

            logger.debug({ procedureId }, 'Procedure updated');
            return rows[0];
        });
    }

    /**
     * Search procedures with filters
     * Supports person, visit, date range, and pagination
     */
    async searchProcedures(filters: ProcedureSearchFilters): Promise<{
        procedures: Procedure[];
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
                conditions.push(`procedure_occurrence_id < $${paramIndex++}`);
                params.push(cursorData.procedure_occurrence_id);
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

        // Filter by date range
        if (filters.date_from) {
            conditions.push(`procedure_date >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`procedure_date <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get procedures (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Procedure>(
            `SELECT procedure_occurrence_id, person_id, procedure_concept_id, procedure_date,
              procedure_type_concept_id, visit_occurrence_id,
              created_at, updated_at
       FROM procedure_occurrence
       ${whereClause}
       ORDER BY procedure_occurrence_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const procedures = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && procedures.length > 0) {
            const lastProcedure = procedures[procedures.length - 1];
            const cursorData = {
                procedure_occurrence_id: lastProcedure.procedure_occurrence_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            procedures,
            nextCursor,
        };
    }
}

