import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    CreateVisitData,
    UpdateVisitData,
    VisitsRepository,
} from './visits.repository';

/**
 * Visits Service
 * Business logic for visit management
 * Prevents overlapping inpatient visits
 */
@Injectable()
export class VisitsService {
    constructor(private readonly visitsRepository: VisitsRepository) { }

    /**
     * Create a new visit
     * Prevents overlapping inpatient visits for the same patient
     */
    async createVisit(data: {
        person_id: number;
        visit_concept_id?: number;
        visit_type: 'OPD' | 'IPD' | 'ER';
        visit_start: string;
        visit_end?: string;
        department_id?: number;
        provider_id?: string;
        reason?: string;
    }) {
        // Parse dates
        const visitStart = new Date(data.visit_start);
        if (isNaN(visitStart.getTime())) {
            throw new BadRequestException('Invalid visit start date');
        }

        const visitEnd = data.visit_end ? new Date(data.visit_end) : null;
        if (visitEnd && isNaN(visitEnd.getTime())) {
            throw new BadRequestException('Invalid visit end date');
        }

        // Validate date range
        if (visitEnd && visitEnd < visitStart) {
            throw new BadRequestException('Visit end date cannot be before start date');
        }

        // Check for overlapping inpatient visits
        if (data.visit_type === 'IPD') {
            const hasOverlap = await this.visitsRepository.hasOverlappingInpatientVisit(
                data.person_id,
                visitStart,
                visitEnd,
            );

            if (hasOverlap) {
                throw new ConflictException(
                    'Patient already has an active inpatient visit. Cannot create overlapping IPD visit.',
                );
            }
        }

        // Default visit_concept_id if not provided (9201 = Outpatient Visit)
        // In production, this should be validated against concept table
        const visitConceptId = data.visit_concept_id || 9201;

        const createData: CreateVisitData = {
            person_id: data.person_id,
            visit_concept_id: visitConceptId,
            visit_start: visitStart,
            visit_end: visitEnd,
            visit_type: data.visit_type,
            department_id: data.department_id,
            provider_id: data.provider_id,
            reason: data.reason,
        };

        try {
            const visit = await this.visitsRepository.createVisit(createData);
            logger.info(
                { visitId: visit.visit_occurrence_id, visitNumber: visit.visit_number, personId: data.person_id },
                'Visit created',
            );
            return visit;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create visit');
            throw error;
        }
    }

    /**
     * Get visit by ID
     */
    async getVisitById(visitId: number) {
        const visit = await this.visitsRepository.findById(visitId);
        if (!visit) {
            throw new NotFoundException('Visit not found');
        }
        return visit;
    }

    /**
     * Get visit by visit number
     */
    async getVisitByVisitNumber(visitNumber: string) {
        const visit = await this.visitsRepository.findByVisitNumber(visitNumber);
        if (!visit) {
            throw new NotFoundException('Visit not found');
        }
        return visit;
    }

    /**
     * Update visit
     * Prevents overlapping inpatient visits if type is changed to IPD
     */
    async updateVisit(
        visitId: number,
        data: {
            visit_concept_id?: number;
            visit_type?: 'OPD' | 'IPD' | 'ER';
            visit_start?: string;
            visit_end?: string;
            department_id?: number;
            provider_id?: string;
            reason?: string;
        },
    ) {
        // Check if visit exists
        const existingVisit = await this.visitsRepository.findById(visitId);
        if (!existingVisit) {
            throw new NotFoundException('Visit not found');
        }

        const updateData: UpdateVisitData = {};

        if (data.visit_concept_id !== undefined) {
            updateData.visit_concept_id = data.visit_concept_id;
        }

        if (data.visit_type !== undefined) {
            updateData.visit_type = data.visit_type;
        }

        if (data.visit_start !== undefined) {
            const visitStart = new Date(data.visit_start);
            if (isNaN(visitStart.getTime())) {
                throw new BadRequestException('Invalid visit start date');
            }
            updateData.visit_start = visitStart;
        } else {
            updateData.visit_start = existingVisit.visit_start;
        }

        if (data.visit_end !== undefined) {
            const visitEnd = data.visit_end ? new Date(data.visit_end) : null;
            if (visitEnd && isNaN(visitEnd.getTime())) {
                throw new BadRequestException('Invalid visit end date');
            }
            updateData.visit_end = visitEnd;
        } else {
            updateData.visit_end = existingVisit.visit_end;
        }

        // Validate date range
        const finalStart = updateData.visit_start || existingVisit.visit_start;
        const finalEnd = updateData.visit_end !== undefined ? updateData.visit_end : existingVisit.visit_end;
        if (finalEnd && finalEnd < finalStart) {
            throw new BadRequestException('Visit end date cannot be before start date');
        }

        // Check for overlapping inpatient visits if type is IPD or being changed to IPD
        const finalType = updateData.visit_type || existingVisit.visit_type;
        if (finalType === 'IPD') {
            const hasOverlap = await this.visitsRepository.hasOverlappingInpatientVisit(
                existingVisit.person_id,
                finalStart,
                finalEnd,
                visitId, // Exclude current visit
            );

            if (hasOverlap) {
                throw new ConflictException(
                    'Patient already has an active inpatient visit. Cannot update to overlapping IPD visit.',
                );
            }
        }

        if (data.department_id !== undefined) {
            updateData.department_id = data.department_id;
        }

        if (data.provider_id !== undefined) {
            updateData.provider_id = data.provider_id;
        }

        if (data.reason !== undefined) {
            updateData.reason = data.reason;
        }

        try {
            const visit = await this.visitsRepository.updateVisit(visitId, updateData);
            logger.info({ visitId }, 'Visit updated');
            return visit;
        } catch (error: any) {
            if (error.message === 'VISIT_NOT_FOUND') {
                throw new NotFoundException('Visit not found');
            }
            throw error;
        }
    }

    /**
     * Search visits with filters
     */
    async searchVisits(params: {
        limit?: number;
        cursor?: string;
        person_id?: number;
        provider_id?: string;
        type?: 'OPD' | 'IPD' | 'ER';
        date_from?: string;
        date_to?: string;
    }) {
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page

        const filters: any = {
            limit,
            cursor: params.cursor,
            person_id: params.person_id,
            provider_id: params.provider_id,
            type: params.type,
        };

        if (params.date_from) {
            filters.date_from = new Date(params.date_from);
        }

        if (params.date_to) {
            filters.date_to = new Date(params.date_to);
        }

        const result = await this.visitsRepository.searchVisits(filters);

        return {
            items: result.visits,
            nextCursor: result.nextCursor,
        };
    }

    /**
     * Get active inpatient visits for a patient
     */
    async getActiveInpatientVisits(personId: number) {
        return this.visitsRepository.getActiveInpatientVisits(personId);
    }
}

