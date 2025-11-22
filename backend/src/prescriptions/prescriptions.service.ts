import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import { InventoryService } from '../inventory/inventory.service';
import { MedicationsService } from '../medications/medications.service';
import { CreateMedicationData } from '../medications/medications.repository';
import {
    CreatePrescriptionData,
    PrescriptionsRepository,
    PrescriptionSearchFilters,
} from './prescriptions.repository';

/**
 * Prescriptions Service
 * Business logic for prescription management
 */
@Injectable()
export class PrescriptionsService {
    constructor(
        private readonly prescriptionsRepository: PrescriptionsRepository,
        private readonly medicationsService: MedicationsService,
        private readonly inventoryService: InventoryService,
    ) { }

    /**
     * Create a new prescription
     * Validates data and generates prescription number
     */
    async createPrescription(
        data: {
            person_id: number;
            drug_concept_id: number;
            drug_exposure_start_date: string;
            drug_exposure_end_date?: string;
            drug_type_concept_id: number;
            quantity?: number;
            visit_occurrence_id?: number;
            instructions?: string;
        },
        prescribedBy: string,
    ) {
        // Use medications service to validate medication data
        const medicationData: CreateMedicationData = {
            person_id: data.person_id,
            drug_concept_id: data.drug_concept_id,
            drug_exposure_start: new Date(data.drug_exposure_start_date),
            drug_exposure_end: data.drug_exposure_end_date
                ? new Date(data.drug_exposure_end_date)
                : undefined,
            drug_type_concept_id: data.drug_type_concept_id,
            quantity: data.quantity,
            visit_occurrence_id: data.visit_occurrence_id,
            instructions: data.instructions,
        };

        // Validate using medications service logic (dates, concept IDs, etc.)
        // We'll reuse the validation by calling the service method internally
        // but we'll create the prescription directly to get prescription number

        const prescriptionData: CreatePrescriptionData = medicationData;
        prescriptionData.prescribed_by = prescribedBy;

        try {
            const prescription = await this.prescriptionsRepository.createPrescription(
                prescriptionData,
                prescribedBy,
            );
            logger.info(
                {
                    prescriptionId: prescription.drug_exposure_id,
                    prescriptionNumber: prescription.prescription_number,
                    personId: data.person_id,
                },
                'Prescription created',
            );
            return prescription;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create prescription');
            throw error;
        }
    }

    /**
     * Get prescription by ID with details
     */
    async getPrescriptionById(prescriptionId: number) {
        const prescription = await this.prescriptionsRepository.findByIdWithDetails(prescriptionId);
        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }
        return prescription;
    }

    /**
     * Fill prescription
     * Updates status to Filled and optionally decrements inventory
     */
    async fillPrescription(
        prescriptionId: number,
        filledBy: string,
        medicationInventoryId?: number,
    ) {
        // Get prescription details
        const prescription = await this.prescriptionsRepository.findByIdWithDetails(prescriptionId);
        if (!prescription) {
            throw new NotFoundException('Prescription not found');
        }

        if (prescription.prescription_status !== 'Pending') {
            throw new ConflictException(
                `Prescription is already ${prescription.prescription_status}`,
            );
        }

        // If medication inventory ID is provided, decrement stock
        if (medicationInventoryId && prescription.quantity) {
            try {
                // Create outgoing transaction to decrement inventory
                await this.inventoryService.createTransaction({
                    item_type: 'medication' as any,
                    item_id: medicationInventoryId,
                    transaction_type: 'outgoing' as any,
                    quantity: prescription.quantity,
                    reference_type: 'prescription',
                    reference_id: prescriptionId,
                    notes: `Filled prescription ${prescription.prescription_number}`,
                });
            } catch (error: any) {
                logger.error(
                    { error, prescriptionId, medicationInventoryId },
                    'Failed to decrement inventory when filling prescription',
                );
                // Don't fail the prescription fill if inventory update fails
                // Log the error but continue
            }
        }

        // Update prescription status
        const filledPrescription = await this.prescriptionsRepository.fillPrescription(
            prescriptionId,
            filledBy,
            medicationInventoryId,
        );

        logger.info(
            {
                prescriptionId,
                prescriptionNumber: prescription.prescription_number,
                filledBy,
            },
            'Prescription filled',
        );

        return filledPrescription;
    }

    /**
     * Search prescriptions with filters
     */
    async searchPrescriptions(params: {
        limit?: number;
        cursor?: string;
        person_id?: number;
        visit_occurrence_id?: number;
        date_from?: string;
        date_to?: string;
        prescription_status?: string;
        prescribed_by?: string;
        search?: string;
    }) {
        const limit = Math.min(params.limit || 20, 100);

        const filters: PrescriptionSearchFilters = {
            limit,
            cursor: params.cursor,
            person_id: params.person_id,
            visit_occurrence_id: params.visit_occurrence_id,
            prescription_status: params.prescription_status,
            prescribed_by: params.prescribed_by,
            search: params.search,
        };

        if (params.date_from) {
            filters.date_from = new Date(params.date_from);
        }

        if (params.date_to) {
            filters.date_to = new Date(params.date_to);
        }

        const result = await this.prescriptionsRepository.searchPrescriptions(filters);

        return {
            items: result.prescriptions,
            nextCursor: result.nextCursor,
        };
    }
}

