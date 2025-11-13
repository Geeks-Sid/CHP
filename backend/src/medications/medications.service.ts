import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    CreateMedicationData,
    MedicationsRepository,
    UpdateMedicationData,
} from './medications.repository';

/**
 * Medications Service
 * Business logic for medication management
 */
@Injectable()
export class MedicationsService {
    constructor(private readonly medicationsRepository: MedicationsRepository) { }

    /**
     * Create a new medication (drug exposure)
     * Validates dates and concept IDs
     */
    async createMedication(data: {
        person_id: number;
        drug_concept_id: number;
        drug_exposure_start_date: string;
        drug_exposure_end_date?: string;
        drug_type_concept_id: number;
        quantity?: number;
        visit_occurrence_id?: number;
        instructions?: string;
    }) {
        // Parse and validate start date
        const startDate = new Date(data.drug_exposure_start_date);
        if (isNaN(startDate.getTime())) {
            throw new BadRequestException('Invalid drug exposure start date');
        }

        // Parse and validate end date if provided
        let endDate: Date | undefined;
        if (data.drug_exposure_end_date) {
            endDate = new Date(data.drug_exposure_end_date);
            if (isNaN(endDate.getTime())) {
                throw new BadRequestException('Invalid drug exposure end date');
            }

            // Validate date range
            if (endDate < startDate) {
                throw new BadRequestException('Drug exposure end date cannot be before start date');
            }
        }

        // Validate concept IDs (basic validation - in production, should check against concept table)
        if (data.drug_concept_id < 1) {
            throw new BadRequestException('Invalid drug concept ID');
        }

        if (data.drug_type_concept_id < 1) {
            throw new BadRequestException('Invalid drug type concept ID');
        }

        // Validate quantity if provided (must be positive)
        if (data.quantity !== undefined && data.quantity < 0) {
            throw new BadRequestException('Quantity cannot be negative');
        }

        const createData: CreateMedicationData = {
            person_id: data.person_id,
            drug_concept_id: data.drug_concept_id,
            drug_exposure_start: startDate,
            drug_exposure_end: endDate,
            drug_type_concept_id: data.drug_type_concept_id,
            quantity: data.quantity,
            visit_occurrence_id: data.visit_occurrence_id,
            instructions: data.instructions,
        };

        try {
            const medication = await this.medicationsRepository.createMedication(createData);
            logger.info(
                { medicationId: medication.drug_exposure_id, personId: data.person_id },
                'Medication created',
            );
            return medication;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create medication');
            throw error;
        }
    }

    /**
     * Get medication by ID
     */
    async getMedicationById(medicationId: number) {
        const medication = await this.medicationsRepository.findById(medicationId);
        if (!medication) {
            throw new NotFoundException('Medication not found');
        }
        return medication;
    }

    /**
     * Update medication
     */
    async updateMedication(
        medicationId: number,
        data: {
            drug_concept_id?: number;
            drug_exposure_start_date?: string;
            drug_exposure_end_date?: string;
            drug_type_concept_id?: number;
            quantity?: number;
            visit_occurrence_id?: number;
            instructions?: string;
        },
    ) {
        // Check if medication exists
        const existingMedication = await this.medicationsRepository.findById(medicationId);
        if (!existingMedication) {
            throw new NotFoundException('Medication not found');
        }

        const updateData: UpdateMedicationData = {};

        if (data.drug_concept_id !== undefined) {
            if (data.drug_concept_id < 1) {
                throw new BadRequestException('Invalid drug concept ID');
            }
            updateData.drug_concept_id = data.drug_concept_id;
        }

        if (data.drug_exposure_start_date !== undefined) {
            const startDate = new Date(data.drug_exposure_start_date);
            if (isNaN(startDate.getTime())) {
                throw new BadRequestException('Invalid drug exposure start date');
            }
            updateData.drug_exposure_start = startDate;
        } else {
            updateData.drug_exposure_start = existingMedication.drug_exposure_start;
        }

        if (data.drug_exposure_end_date !== undefined) {
            const endDate = data.drug_exposure_end_date ? new Date(data.drug_exposure_end_date) : null;
            if (endDate && isNaN(endDate.getTime())) {
                throw new BadRequestException('Invalid drug exposure end date');
            }

            // Validate date range
            const finalStart = updateData.drug_exposure_start || existingMedication.drug_exposure_start;
            if (endDate && endDate < finalStart) {
                throw new BadRequestException('Drug exposure end date cannot be before start date');
            }

            updateData.drug_exposure_end = endDate;
        }

        if (data.drug_type_concept_id !== undefined) {
            if (data.drug_type_concept_id < 1) {
                throw new BadRequestException('Invalid drug type concept ID');
            }
            updateData.drug_type_concept_id = data.drug_type_concept_id;
        }

        if (data.quantity !== undefined) {
            if (data.quantity < 0) {
                throw new BadRequestException('Quantity cannot be negative');
            }
            updateData.quantity = data.quantity;
        }

        if (data.visit_occurrence_id !== undefined) {
            updateData.visit_occurrence_id = data.visit_occurrence_id;
        }

        if (data.instructions !== undefined) {
            updateData.instructions = data.instructions;
        }

        try {
            const medication = await this.medicationsRepository.updateMedication(medicationId, updateData);
            logger.info({ medicationId }, 'Medication updated');
            return medication;
        } catch (error: any) {
            if (error.message === 'MEDICATION_NOT_FOUND') {
                throw new NotFoundException('Medication not found');
            }
            throw error;
        }
    }

    /**
     * Search medications with filters
     */
    async searchMedications(params: {
        limit?: number;
        cursor?: string;
        person_id?: number;
        visit_occurrence_id?: number;
        date_from?: string;
        date_to?: string;
    }) {
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page

        const filters: any = {
            limit,
            cursor: params.cursor,
            person_id: params.person_id,
            visit_occurrence_id: params.visit_occurrence_id,
        };

        if (params.date_from) {
            filters.date_from = new Date(params.date_from);
        }

        if (params.date_to) {
            filters.date_to = new Date(params.date_to);
        }

        const result = await this.medicationsRepository.searchMedications(filters);

        return {
            items: result.medications,
            nextCursor: result.nextCursor,
        };
    }
}

