import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreatePersonData {
    user_id?: string;
    first_name?: string;
    last_name?: string;
    gender_concept_id: number;
    year_of_birth: number;
    month_of_birth?: number;
    day_of_birth?: number;
    birth_datetime?: Date;
    race_concept_id?: number;
    ethnicity_concept_id?: number;
    person_source_value?: string;
    contact_phone?: string;
    contact_email?: string;
}

export interface UpdatePersonData {
    first_name?: string;
    last_name?: string;
    gender_concept_id?: number;
    year_of_birth?: number;
    month_of_birth?: number;
    day_of_birth?: number;
    birth_datetime?: Date;
    race_concept_id?: number;
    ethnicity_concept_id?: number;
    person_source_value?: string;
    contact_phone?: string;
    contact_email?: string;
}

export interface Person {
    person_id: number;
    user_id?: string;
    first_name?: string;
    last_name?: string;
    gender_concept_id: number;
    year_of_birth: number;
    month_of_birth?: number;
    day_of_birth?: number;
    birth_datetime?: Date;
    race_concept_id?: number;
    ethnicity_concept_id?: number;
    person_source_value?: string;
    mrn: string;
    contact_phone?: string;
    contact_email?: string;
    created_at: Date;
    updated_at: Date;
}

export interface PersonSearchFilters {
    search?: string;
    dob?: string; // YYYY-MM-DD
    gender_concept_id?: number;
    limit?: number;
    cursor?: string;
}

/**
 * Patients Repository
 * Handles all database operations for patients (person table)
 * Uses advisory locks for MRN generation to prevent race conditions
 */
@Injectable()
export class PatientsRepository {
    private readonly MRN_LOCK_KEY = 1000000; // Advisory lock key for MRN generation

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Generate MRN using advisory lock to prevent race conditions
     * Format: MRN-YYYY-NNNNNN
     */
    private async generateMRN(client: PoolClient): Promise<string> {
        // Use advisory lock to ensure atomic MRN generation
        const lockResult = await client.query(
            `SELECT pg_try_advisory_xact_lock($1) as locked`,
            [this.MRN_LOCK_KEY],
        );

        if (!lockResult.rows[0].locked) {
            throw new Error('Failed to acquire lock for MRN generation');
        }

        // Get next sequence value
        const seqResult = await client.query(`SELECT nextval('seq_mrn') AS n`);
        const sequenceNumber = seqResult.rows[0].n;

        // Format: MRN-YYYY-NNNNNN
        const year = new Date().getUTCFullYear();
        const mrn = `MRN-${year}-${String(sequenceNumber).padStart(6, '0')}`;

        return mrn;
    }

    /**
     * Create a new person (patient)
     * Uses transaction and advisory lock for MRN generation
     */
    async createPerson(data: CreatePersonData): Promise<Person> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Generate MRN with advisory lock
            const mrn = await this.generateMRN(client);

            // Check if user_id is already linked to another person
            if (data.user_id) {
                const { rows } = await client.query(
                    `SELECT person_id FROM person WHERE user_id = $1`,
                    [data.user_id],
                );

                if (rows.length > 0) {
                    throw new Error('USER_ALREADY_LINKED');
                }
            }

            // Insert person
            const { rows } = await client.query<Person>(
                `INSERT INTO person (
          user_id, first_name, last_name, gender_concept_id,
          year_of_birth, month_of_birth, day_of_birth, birth_datetime,
          race_concept_id, ethnicity_concept_id, person_source_value, mrn,
          contact_phone, contact_email
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING person_id, user_id, first_name, last_name, gender_concept_id,
                  year_of_birth, month_of_birth, day_of_birth, birth_datetime,
                  race_concept_id, ethnicity_concept_id, person_source_value, mrn,
                  contact_phone, contact_email, created_at, updated_at`,
                [
                    data.user_id || null,
                    data.first_name || null,
                    data.last_name || null,
                    data.gender_concept_id,
                    data.year_of_birth,
                    data.month_of_birth || null,
                    data.day_of_birth || null,
                    data.birth_datetime || null,
                    data.race_concept_id || null,
                    data.ethnicity_concept_id || null,
                    data.person_source_value || null,
                    mrn,
                    data.contact_phone || null,
                    data.contact_email || null,
                ],
            );

            logger.debug({ personId: rows[0].person_id, mrn }, 'Person created');
            return rows[0];
        });
    }

    /**
     * Find person by ID
     */
    async findById(personId: number): Promise<Person | null> {
        const { rows } = await this.databaseService.query<Person>(
            `SELECT person_id, user_id, first_name, last_name, gender_concept_id,
              year_of_birth, month_of_birth, day_of_birth, birth_datetime,
              race_concept_id, ethnicity_concept_id, person_source_value, mrn,
              contact_phone, contact_email, created_at, updated_at
       FROM person
       WHERE person_id = $1`,
            [personId],
        );

        return rows[0] || null;
    }

    /**
     * Find person by MRN
     */
    async findByMRN(mrn: string): Promise<Person | null> {
        const { rows } = await this.databaseService.query<Person>(
            `SELECT person_id, user_id, first_name, last_name, gender_concept_id,
              year_of_birth, month_of_birth, day_of_birth, birth_datetime,
              race_concept_id, ethnicity_concept_id, person_source_value, mrn,
              contact_phone, contact_email, created_at, updated_at
       FROM person
       WHERE mrn = $1`,
            [mrn],
        );

        return rows[0] || null;
    }

    /**
     * Update person
     */
    async updatePerson(personId: number, data: UpdatePersonData): Promise<Person> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.first_name !== undefined) {
                updates.push(`first_name = $${paramIndex++}`);
                values.push(data.first_name || null);
            }

            if (data.last_name !== undefined) {
                updates.push(`last_name = $${paramIndex++}`);
                values.push(data.last_name || null);
            }

            if (data.gender_concept_id !== undefined) {
                updates.push(`gender_concept_id = $${paramIndex++}`);
                values.push(data.gender_concept_id);
            }

            if (data.year_of_birth !== undefined) {
                updates.push(`year_of_birth = $${paramIndex++}`);
                values.push(data.year_of_birth);
            }

            if (data.month_of_birth !== undefined) {
                updates.push(`month_of_birth = $${paramIndex++}`);
                values.push(data.month_of_birth || null);
            }

            if (data.day_of_birth !== undefined) {
                updates.push(`day_of_birth = $${paramIndex++}`);
                values.push(data.day_of_birth || null);
            }

            if (data.birth_datetime !== undefined) {
                updates.push(`birth_datetime = $${paramIndex++}`);
                values.push(data.birth_datetime || null);
            }

            if (data.race_concept_id !== undefined) {
                updates.push(`race_concept_id = $${paramIndex++}`);
                values.push(data.race_concept_id || null);
            }

            if (data.ethnicity_concept_id !== undefined) {
                updates.push(`ethnicity_concept_id = $${paramIndex++}`);
                values.push(data.ethnicity_concept_id || null);
            }

            if (data.person_source_value !== undefined) {
                updates.push(`person_source_value = $${paramIndex++}`);
                values.push(data.person_source_value || null);
            }

            if (data.contact_phone !== undefined) {
                updates.push(`contact_phone = $${paramIndex++}`);
                values.push(data.contact_phone || null);
            }

            if (data.contact_email !== undefined) {
                updates.push(`contact_email = $${paramIndex++}`);
                values.push(data.contact_email || null);
            }

            if (updates.length === 0) {
                // No updates, just return existing person
                const person = await this.findById(personId);
                if (!person) {
                    throw new Error('PERSON_NOT_FOUND');
                }
                return person;
            }

            values.push(personId);

            const { rows } = await client.query<Person>(
                `UPDATE person
         SET ${updates.join(', ')}
         WHERE person_id = $${paramIndex}
         RETURNING person_id, user_id, first_name, last_name, gender_concept_id,
                   year_of_birth, month_of_birth, day_of_birth, birth_datetime,
                   race_concept_id, ethnicity_concept_id, person_source_value, mrn,
                   contact_phone, contact_email, created_at, updated_at`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('PERSON_NOT_FOUND');
            }

            logger.debug({ personId }, 'Person updated');
            return rows[0];
        });
    }

    /**
     * Search persons with filters
     * Supports name search, DOB, gender, and pagination
     */
    async searchPersons(filters: PersonSearchFilters): Promise<{
        persons: Person[];
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
                conditions.push(`person_id < $${paramIndex++}`);
                params.push(cursorData.person_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Search by name (uses GIN index on full name)
        if (filters.search) {
            conditions.push(
                `(first_name || ' ' || last_name) ILIKE $${paramIndex} OR mrn ILIKE $${paramIndex}`,
            );
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        // Filter by date of birth
        if (filters.dob) {
            const dob = new Date(filters.dob);
            const year = dob.getUTCFullYear();
            const month = dob.getUTCMonth() + 1;
            const day = dob.getUTCDate();

            conditions.push(`year_of_birth = $${paramIndex++}`);
            params.push(year);

            if (month) {
                conditions.push(`month_of_birth = $${paramIndex++}`);
                params.push(month);
            }

            if (day) {
                conditions.push(`day_of_birth = $${paramIndex++}`);
                params.push(day);
            }
        }

        // Filter by gender
        if (filters.gender_concept_id) {
            conditions.push(`gender_concept_id = $${paramIndex++}`);
            params.push(filters.gender_concept_id);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get persons (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Person>(
            `SELECT person_id, user_id, first_name, last_name, gender_concept_id,
              year_of_birth, month_of_birth, day_of_birth, birth_datetime,
              race_concept_id, ethnicity_concept_id, person_source_value, mrn,
              contact_phone, contact_email, created_at, updated_at
       FROM person
       ${whereClause}
       ORDER BY person_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const persons = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && persons.length > 0) {
            const lastPerson = persons[persons.length - 1];
            const cursorData = {
                person_id: lastPerson.person_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            persons,
            nextCursor,
        };
    }
}

