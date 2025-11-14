import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    CreateProcedureData,
    ProceduresRepository,
    UpdateProcedureData,
} from './procedures.repository';

/**
 * Procedures Service
 * Business logic for procedure management
 */
@Injectable()
export class ProceduresService {
    constructor(private readonly proceduresRepository: ProceduresRepository) { }

    /**
     * Create a new procedure
     * Validates dates and concept IDs
     */
    async createProcedure(data: {
        person_id: number;
        procedure_concept_id: number;
        procedure_date: string;
        procedure_type_concept_id: number;
        visit_occurrence_id?: number;
    }) {
        // Parse and validate procedure date
        const procedureDate = new Date(data.procedure_date);
        if (isNaN(procedureDate.getTime())) {
            throw new BadRequestException('Invalid procedure date');
        }

        // Check if procedure date is in the future (reasonable limit: allow up to 1 day in future for scheduling)
        const maxFutureDate = new Date();
        maxFutureDate.setDate(maxFutureDate.getDate() + 1);
        if (procedureDate > maxFutureDate) {
            throw new BadRequestException('Procedure date cannot be more than 1 day in the future');
        }

        // Validate concept IDs (basic validation - in production, should check against concept table)
        if (data.procedure_concept_id < 1) {
            throw new BadRequestException('Invalid procedure concept ID');
        }

        if (data.procedure_type_concept_id < 1) {
            throw new BadRequestException('Invalid procedure type concept ID');
        }

        const createData: CreateProcedureData = {
            person_id: data.person_id,
            procedure_concept_id: data.procedure_concept_id,
            procedure_date: procedureDate,
            procedure_type_concept_id: data.procedure_type_concept_id,
            visit_occurrence_id: data.visit_occurrence_id,
        };

        try {
            const procedure = await this.proceduresRepository.createProcedure(createData);
            logger.info(
                { procedureId: procedure.procedure_occurrence_id, personId: data.person_id },
                'Procedure created',
            );
            return procedure;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create procedure');
            throw error;
        }
    }

    /**
     * Get procedure by ID
     */
    async getProcedureById(procedureId: number) {
        const procedure = await this.proceduresRepository.findById(procedureId);
        if (!procedure) {
            throw new NotFoundException('Procedure not found');
        }
        return procedure;
    }

    /**
     * Update procedure
     */
    async updateProcedure(
        procedureId: number,
        data: {
            procedure_concept_id?: number;
            procedure_date?: string;
            procedure_type_concept_id?: number;
            visit_occurrence_id?: number;
        },
    ) {
        // Check if procedure exists
        const existingProcedure = await this.proceduresRepository.findById(procedureId);
        if (!existingProcedure) {
            throw new NotFoundException('Procedure not found');
        }

        const updateData: UpdateProcedureData = {};

        if (data.procedure_concept_id !== undefined) {
            if (data.procedure_concept_id < 1) {
                throw new BadRequestException('Invalid procedure concept ID');
            }
            updateData.procedure_concept_id = data.procedure_concept_id;
        }

        if (data.procedure_date !== undefined) {
            const procedureDate = new Date(data.procedure_date);
            if (isNaN(procedureDate.getTime())) {
                throw new BadRequestException('Invalid procedure date');
            }

            // Check if procedure date is in the future (reasonable limit: allow up to 1 day in future)
            const maxFutureDate = new Date();
            maxFutureDate.setDate(maxFutureDate.getDate() + 1);
            if (procedureDate > maxFutureDate) {
                throw new BadRequestException('Procedure date cannot be more than 1 day in the future');
            }

            updateData.procedure_date = procedureDate;
        }

        if (data.procedure_type_concept_id !== undefined) {
            if (data.procedure_type_concept_id < 1) {
                throw new BadRequestException('Invalid procedure type concept ID');
            }
            updateData.procedure_type_concept_id = data.procedure_type_concept_id;
        }

        if (data.visit_occurrence_id !== undefined) {
            updateData.visit_occurrence_id = data.visit_occurrence_id;
        }

        try {
            const procedure = await this.proceduresRepository.updateProcedure(procedureId, updateData);
            logger.info({ procedureId }, 'Procedure updated');
            return procedure;
        } catch (error: any) {
            if (error.message === 'PROCEDURE_NOT_FOUND') {
                throw new NotFoundException('Procedure not found');
            }
            throw error;
        }
    }

    /**
     * Search procedures with filters
     */
    async searchProcedures(params: {
        limit?: number;
        cursor?: string;
        person_id?: number;
        visit_occurrence_id?: number;
        date_from?: string;
        date_to?: string;
        search?: string;
    }) {
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page

        const filters: any = {
            limit,
            cursor: params.cursor,
            person_id: params.person_id,
            visit_occurrence_id: params.visit_occurrence_id,
            search: params.search,
        };

        if (params.date_from) {
            filters.date_from = new Date(params.date_from);
        }

        if (params.date_to) {
            filters.date_to = new Date(params.date_to);
        }

        const result = await this.proceduresRepository.searchProcedures(filters);

        return {
            items: result.procedures,
            nextCursor: result.nextCursor,
        };
    }
}

