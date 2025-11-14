import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';
import {
    CreateMedicationData,
    Medication,
} from '../medications/medications.repository';

export interface CreatePrescriptionData extends CreateMedicationData {
    prescribed_by?: string;
}

export interface Prescription extends Medication {
    prescription_status?: string;
    prescribed_by?: string;
    filled_by?: string;
    filled_at?: Date;
    prescription_number?: string;
}

export interface PrescriptionSearchFilters {
    person_id?: number;
    visit_occurrence_id?: number;
    date_from?: Date;
    date_to?: Date;
    prescription_status?: string;
    prescribed_by?: string;
    search?: string; // Search by patient name, medication name, or prescription number
    limit?: number;
    cursor?: string;
}

/**
 * Prescriptions Repository
 * Handles all database operations for prescriptions (extends drug_exposure table)
 */
@Injectable()
export class PrescriptionsRepository {
    private readonly PRESCRIPTION_LOCK_KEY = 1000001; // Advisory lock key for prescription number generation

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Generate prescription number using advisory lock to prevent race conditions
     * Format: RX-YYYY-NNNNNN
     */
    private async generatePrescriptionNumber(client: PoolClient): Promise<string> {
        // Use advisory lock to ensure atomic prescription number generation
        const lockResult = await client.query(
            `SELECT pg_try_advisory_xact_lock($1) as locked`,
            [this.PRESCRIPTION_LOCK_KEY],
        );

        if (!lockResult.rows[0].locked) {
            throw new Error('Failed to acquire lock for prescription number generation');
        }

        // Get next sequence value
        const seqResult = await client.query(`SELECT nextval('seq_prescription') AS n`);
        const sequenceNumber = seqResult.rows[0].n;

        // Format: RX-YYYY-NNNNNN
        const year = new Date().getUTCFullYear();
        const prescriptionNumber = `RX-${year}-${String(sequenceNumber).padStart(6, '0')}`;

        return prescriptionNumber;
    }

    /**
     * Create a new prescription
     * Generates prescription number and sets status to Pending
     */
    async createPrescription(data: CreatePrescriptionData, prescribedBy?: string): Promise<Prescription> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Generate prescription number
            const prescriptionNumber = await this.generatePrescriptionNumber(client);

            // Insert prescription (using drug_exposure table with prescription fields)
            const { rows } = await client.query<Prescription>(
                `INSERT INTO drug_exposure (
          person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
          drug_type_concept_id, quantity, visit_occurrence_id, instructions,
          prescription_status, prescribed_by, prescription_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
                  drug_type_concept_id, quantity, visit_occurrence_id, instructions,
                  prescription_status, prescribed_by, filled_by, filled_at, prescription_number,
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
                    'Pending',
                    prescribedBy || data.prescribed_by || null,
                    prescriptionNumber,
                ],
            );

            logger.debug(
                { prescriptionId: rows[0].drug_exposure_id, prescriptionNumber, personId: data.person_id },
                'Prescription created',
            );
            return rows[0];
        });
    }

    /**
     * Find prescription by ID with joined data
     */
    async findByIdWithDetails(prescriptionId: number): Promise<Prescription | null> {
        const { rows } = await this.databaseService.query<Prescription>(
            `SELECT 
              de.drug_exposure_id, de.person_id, de.drug_concept_id, 
              de.drug_exposure_start, de.drug_exposure_end,
              de.drug_type_concept_id, de.quantity, de.visit_occurrence_id, de.instructions,
              de.prescription_status, de.prescribed_by, de.filled_by, de.filled_at, de.prescription_number,
              de.created_at, de.updated_at,
              p.first_name || ' ' || p.last_name as patient_name,
              c.concept_name as medication_name,
              u_prescribed.username as prescriber_name
       FROM drug_exposure de
       LEFT JOIN person p ON de.person_id = p.person_id
       LEFT JOIN concept c ON de.drug_concept_id = c.concept_id
       LEFT JOIN users u_prescribed ON de.prescribed_by = u_prescribed.user_id
       WHERE de.drug_exposure_id = $1`,
            [prescriptionId],
        );

        return rows[0] || null;
    }

    /**
     * Update prescription status to Filled
     */
    async fillPrescription(
        prescriptionId: number,
        filledBy: string,
        medicationInventoryId?: number,
    ): Promise<Prescription> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Check if prescription exists and is in Pending status
            const existing = await client.query<Prescription>(
                `SELECT prescription_status, quantity, drug_concept_id
         FROM drug_exposure
         WHERE drug_exposure_id = $1`,
                [prescriptionId],
            );

            if (existing.rows.length === 0) {
                throw new Error('PRESCRIPTION_NOT_FOUND');
            }

            if (existing.rows[0].prescription_status !== 'Pending') {
                throw new Error('PRESCRIPTION_ALREADY_FILLED');
            }

            // Update prescription status
            const { rows } = await client.query<Prescription>(
                `UPDATE drug_exposure
         SET prescription_status = 'Filled',
             filled_by = $1,
             filled_at = now()
         WHERE drug_exposure_id = $2
         RETURNING drug_exposure_id, person_id, drug_concept_id, drug_exposure_start, drug_exposure_end,
                   drug_type_concept_id, quantity, visit_occurrence_id, instructions,
                   prescription_status, prescribed_by, filled_by, filled_at, prescription_number,
                   created_at, updated_at`,
                [filledBy, prescriptionId],
            );

            logger.debug({ prescriptionId, filledBy }, 'Prescription filled');
            return rows[0];
        });
    }

    /**
     * Search prescriptions with filters
     * Supports status filtering, search by patient/medication name, and pagination
     */
    async searchPrescriptions(filters: PrescriptionSearchFilters): Promise<{
        prescriptions: Prescription[];
        nextCursor?: string;
    }> {
        const limit = Math.min(filters.limit || 20, 100);
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Only get prescriptions (where prescription_number is not null)
        conditions.push('prescription_number IS NOT NULL');

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

        // Filter by patient ID
        if (filters.person_id) {
            conditions.push(`de.person_id = $${paramIndex++}`);
            params.push(filters.person_id);
        }

        // Filter by visit
        if (filters.visit_occurrence_id) {
            conditions.push(`de.visit_occurrence_id = $${paramIndex++}`);
            params.push(filters.visit_occurrence_id);
        }

        // Filter by date range
        if (filters.date_from) {
            conditions.push(`de.drug_exposure_start >= $${paramIndex++}`);
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            conditions.push(`de.drug_exposure_start <= $${paramIndex++}`);
            params.push(filters.date_to);
        }

        // Filter by prescription status
        if (filters.prescription_status) {
            conditions.push(`de.prescription_status = $${paramIndex++}`);
            params.push(filters.prescription_status);
        }

        // Filter by prescriber
        if (filters.prescribed_by) {
            conditions.push(`de.prescribed_by = $${paramIndex++}`);
            params.push(filters.prescribed_by);
        }

        // Search by patient name, medication name, or prescription number
        if (filters.search) {
            conditions.push(
                `(p.first_name || ' ' || p.last_name ILIKE $${paramIndex} OR 
                  c.concept_name ILIKE $${paramIndex} OR 
                  de.prescription_number ILIKE $${paramIndex})`,
            );
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get prescriptions (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Prescription>(
            `SELECT 
              de.drug_exposure_id, de.person_id, de.drug_concept_id, 
              de.drug_exposure_start, de.drug_exposure_end,
              de.drug_type_concept_id, de.quantity, de.visit_occurrence_id, de.instructions,
              de.prescription_status, de.prescribed_by, de.filled_by, de.filled_at, de.prescription_number,
              de.created_at, de.updated_at,
              p.first_name || ' ' || p.last_name as patient_name,
              c.concept_name as medication_name,
              u_prescribed.username as prescriber_name
       FROM drug_exposure de
       LEFT JOIN person p ON de.person_id = p.person_id
       LEFT JOIN concept c ON de.drug_concept_id = c.concept_id
       LEFT JOIN users u_prescribed ON de.prescribed_by = u_prescribed.user_id
       ${whereClause}
       ORDER BY de.drug_exposure_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const prescriptions = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && prescriptions.length > 0) {
            const lastPrescription = prescriptions[prescriptions.length - 1];
            const cursorData = {
                drug_exposure_id: lastPrescription.drug_exposure_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            prescriptions,
            nextCursor,
        };
    }
}

