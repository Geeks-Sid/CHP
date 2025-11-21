import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    CreateDiagnosisData,
    DiagnosesRepository,
    UpdateDiagnosisData,
} from './diagnoses.repository';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { DiagnosisResponseDto } from './dto/diagnosis-response.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

/**
 * Diagnoses Service
 * Business logic for diagnosis management
 */
@Injectable()
export class DiagnosesService {
    constructor(private readonly diagnosesRepository: DiagnosesRepository) { }

    /**
     * Create a new diagnosis
     * Validates dates, concept IDs, and handles principal diagnosis logic
     */
    async createDiagnosis(data: CreateDiagnosisDto, userId?: string): Promise<DiagnosisResponseDto> {
        // Parse and validate dates
        const conditionStartDate = new Date(data.condition_start_date);
        if (isNaN(conditionStartDate.getTime())) {
            throw new BadRequestException('Invalid condition start date');
        }

        const conditionStartDatetime = data.condition_start_datetime
            ? new Date(data.condition_start_datetime)
            : new Date(conditionStartDate);

        const conditionEndDate = data.condition_end_date
            ? new Date(data.condition_end_date)
            : null;

        const conditionEndDatetime = data.condition_end_datetime
            ? new Date(data.condition_end_datetime)
            : null;

        // Validate date range
        if (conditionEndDate && conditionEndDate < conditionStartDate) {
            throw new BadRequestException('Condition end date cannot be before start date');
        }

        // Validate concept IDs (basic validation - in production, should check against concept table)
        if (data.condition_concept_id < 1) {
            throw new BadRequestException('Invalid condition concept ID');
        }

        if (data.condition_type_concept_id < 1) {
            throw new BadRequestException('Invalid condition type concept ID');
        }

        const createData: CreateDiagnosisData = {
            person_id: data.person_id,
            condition_concept_id: data.condition_concept_id,
            condition_start_date: conditionStartDate,
            condition_start_datetime: conditionStartDatetime,
            condition_end_date: conditionEndDate || undefined,
            condition_end_datetime: conditionEndDatetime || undefined,
            condition_type_concept_id: data.condition_type_concept_id,
            condition_status_concept_id: data.condition_status_concept_id,
            stop_reason: data.stop_reason,
            provider_id: data.provider_id,
            visit_occurrence_id: data.visit_occurrence_id,
            condition_source_value: data.condition_source_value,
            diagnosis_category: data.diagnosis_category,
            is_principal_diagnosis: data.is_principal_diagnosis || false,
            notes: data.notes,
            created_by: userId,
        };

        try {
            const diagnosis = await this.diagnosesRepository.createDiagnosis(createData);
            const response = await this.mapToResponseDto(diagnosis);

            logger.info(
                {
                    conditionId: diagnosis.condition_occurrence_id,
                    personId: data.person_id,
                    visitId: data.visit_occurrence_id,
                    userId,
                },
                'Diagnosis created',
            );

            return response;
        } catch (error: any) {
            logger.error({ error, data }, 'Failed to create diagnosis');
            throw error;
        }
    }

    /**
     * Get diagnosis by ID
     */
    async getDiagnosisById(conditionId: number): Promise<DiagnosisResponseDto> {
        const diagnosis = await this.diagnosesRepository.findById(conditionId);
        if (!diagnosis) {
            throw new NotFoundException('Diagnosis not found');
        }
        return this.mapToResponseDto(diagnosis);
    }

    /**
     * Get diagnoses by patient
     */
    async getDiagnosesByPatient(
        personId: number,
        filters?: { active_only?: boolean; visit_id?: number },
    ): Promise<DiagnosisResponseDto[]> {
        if (filters?.visit_id) {
            const diagnoses = await this.diagnosesRepository.findByVisitId(filters.visit_id);
            return diagnoses.map((d) => this.mapToResponseDto(d));
        }

        const diagnoses = await this.diagnosesRepository.findByPersonId(personId, {
            active_only: filters?.active_only,
        });
        return diagnoses.map((d) => this.mapToResponseDto(d));
    }

    /**
     * Get diagnoses by visit
     */
    async getDiagnosesByVisit(visitId: number): Promise<DiagnosisResponseDto[]> {
        const diagnoses = await this.diagnosesRepository.findByVisitId(visitId);
        return diagnoses.map((d) => this.mapToResponseDto(d));
    }

    /**
     * Update diagnosis
     */
    async updateDiagnosis(
        conditionId: number,
        data: UpdateDiagnosisDto,
        userId?: string,
    ): Promise<DiagnosisResponseDto> {
        // Check if diagnosis exists
        const existingDiagnosis = await this.diagnosesRepository.findById(conditionId);
        if (!existingDiagnosis) {
            throw new NotFoundException('Diagnosis not found');
        }

        const updateData: UpdateDiagnosisData = {};

        if (data.condition_concept_id !== undefined) {
            if (data.condition_concept_id < 1) {
                throw new BadRequestException('Invalid condition concept ID');
            }
            updateData.condition_concept_id = data.condition_concept_id;
        }

        if (data.condition_start_date !== undefined) {
            const conditionStartDate = new Date(data.condition_start_date);
            if (isNaN(conditionStartDate.getTime())) {
                throw new BadRequestException('Invalid condition start date');
            }
            updateData.condition_start_date = conditionStartDate;
        }

        if (data.condition_start_datetime !== undefined) {
            const conditionStartDatetime = data.condition_start_datetime
                ? new Date(data.condition_start_datetime)
                : null;
            updateData.condition_start_datetime = conditionStartDatetime || undefined;
        }

        if (data.condition_end_date !== undefined) {
            const conditionEndDate = data.condition_end_date ? new Date(data.condition_end_date) : null;
            if (conditionEndDate && conditionEndDate < existingDiagnosis.condition_start_date) {
                throw new BadRequestException('Condition end date cannot be before start date');
            }
            updateData.condition_end_date = conditionEndDate || undefined;
        }

        if (data.condition_end_datetime !== undefined) {
            const conditionEndDatetime = data.condition_end_datetime
                ? new Date(data.condition_end_datetime)
                : null;
            updateData.condition_end_datetime = conditionEndDatetime || undefined;
        }

        if (data.condition_type_concept_id !== undefined) {
            if (data.condition_type_concept_id < 1) {
                throw new BadRequestException('Invalid condition type concept ID');
            }
            updateData.condition_type_concept_id = data.condition_type_concept_id;
        }

        if (data.condition_status_concept_id !== undefined) {
            updateData.condition_status_concept_id = data.condition_status_concept_id;
        }

        if (data.stop_reason !== undefined) {
            updateData.stop_reason = data.stop_reason;
        }

        if (data.provider_id !== undefined) {
            updateData.provider_id = data.provider_id;
        }

        if (data.visit_occurrence_id !== undefined) {
            updateData.visit_occurrence_id = data.visit_occurrence_id;
        }

        if (data.condition_source_value !== undefined) {
            updateData.condition_source_value = data.condition_source_value;
        }

        if (data.diagnosis_category !== undefined) {
            updateData.diagnosis_category = data.diagnosis_category;
        }

        if (data.is_principal_diagnosis !== undefined) {
            updateData.is_principal_diagnosis = data.is_principal_diagnosis;
        }

        if (data.notes !== undefined) {
            updateData.notes = data.notes;
        }

        updateData.updated_by = userId;

        try {
            const diagnosis = await this.diagnosesRepository.updateDiagnosis(conditionId, updateData);
            const response = await this.mapToResponseDto(diagnosis);

            logger.info(
                {
                    conditionId,
                    userId,
                    isPrincipal: data.is_principal_diagnosis,
                },
                'Diagnosis updated',
            );

            return response;
        } catch (error: any) {
            if (error.message === 'DIAGNOSIS_NOT_FOUND') {
                throw new NotFoundException('Diagnosis not found');
            }
            logger.error({ error, conditionId, data }, 'Failed to update diagnosis');
            throw error;
        }
    }

    /**
     * Delete diagnosis
     */
    async deleteDiagnosis(conditionId: number): Promise<void> {
        const diagnosis = await this.diagnosesRepository.findById(conditionId);
        if (!diagnosis) {
            throw new NotFoundException('Diagnosis not found');
        }

        try {
            await this.diagnosesRepository.deleteDiagnosis(conditionId);
            logger.info({ conditionId }, 'Diagnosis deleted');
        } catch (error: any) {
            if (error.message === 'DIAGNOSIS_NOT_FOUND') {
                throw new NotFoundException('Diagnosis not found');
            }
            throw error;
        }
    }

    /**
     * Set principal diagnosis for a visit
     */
    async setPrincipalDiagnosis(conditionId: number, visitId: number): Promise<DiagnosisResponseDto> {
        // Verify diagnosis exists and belongs to visit
        const diagnosis = await this.diagnosesRepository.findById(conditionId);
        if (!diagnosis) {
            throw new NotFoundException('Diagnosis not found');
        }

        if (diagnosis.visit_occurrence_id !== visitId) {
            throw new BadRequestException('Diagnosis does not belong to the specified visit');
        }

        try {
            await this.diagnosesRepository.setPrincipalDiagnosis(conditionId, visitId);
            const updated = await this.diagnosesRepository.findById(conditionId);

            logger.info(
                {
                    conditionId,
                    visitId,
                    previousPrincipal: diagnosis.is_principal_diagnosis,
                },
                'Principal diagnosis set',
            );

            return this.mapToResponseDto(updated!);
        } catch (error: any) {
            if (error.message === 'DIAGNOSIS_NOT_FOUND_OR_NOT_IN_VISIT') {
                throw new NotFoundException('Diagnosis not found or does not belong to visit');
            }
            throw error;
        }
    }

    /**
     * Search diagnoses with filters
     */
    async searchDiagnoses(params: {
        limit?: number;
        cursor?: string;
        person_id?: number;
        visit_occurrence_id?: number;
        active_only?: boolean;
        date_from?: string;
        date_to?: string;
        condition_type_concept_id?: number;
        is_principal_diagnosis?: boolean;
        search?: string;
    }) {
        const limit = Math.min(params.limit || 20, 100);

        const filters: any = {
            limit,
            cursor: params.cursor,
            person_id: params.person_id,
            visit_occurrence_id: params.visit_occurrence_id,
            active_only: params.active_only,
            condition_type_concept_id: params.condition_type_concept_id,
            is_principal_diagnosis: params.is_principal_diagnosis,
            search: params.search,
        };

        if (params.date_from) {
            filters.date_from = new Date(params.date_from);
        }

        if (params.date_to) {
            filters.date_to = new Date(params.date_to);
        }

        const result = await this.diagnosesRepository.searchDiagnoses(filters);

        return {
            items: result.diagnoses.map((d) => this.mapToResponseDto(d)),
            nextCursor: result.nextCursor,
        };
    }

    /**
     * Map diagnosis entity to response DTO
     */
    private async mapToResponseDto(diagnosis: any): Promise<DiagnosisResponseDto> {
        return {
            condition_occurrence_id: diagnosis.condition_occurrence_id,
            person_id: diagnosis.person_id,
            condition_concept_id: diagnosis.condition_concept_id,
            condition_concept_name: diagnosis.condition_concept_name,
            condition_concept_code: diagnosis.condition_concept_code,
            condition_start_date: diagnosis.condition_start_date.toISOString().split('T')[0],
            condition_start_datetime: diagnosis.condition_start_datetime
                ? diagnosis.condition_start_datetime.toISOString()
                : undefined,
            condition_end_date: diagnosis.condition_end_date
                ? diagnosis.condition_end_date.toISOString().split('T')[0]
                : undefined,
            condition_end_datetime: diagnosis.condition_end_datetime
                ? diagnosis.condition_end_datetime.toISOString()
                : undefined,
            condition_type_concept_id: diagnosis.condition_type_concept_id,
            condition_type_name: diagnosis.condition_type_name,
            condition_status_concept_id: diagnosis.condition_status_concept_id,
            condition_status_name: diagnosis.condition_status_name,
            stop_reason: diagnosis.stop_reason,
            provider_id: diagnosis.provider_id,
            provider_name: diagnosis.provider_name,
            visit_occurrence_id: diagnosis.visit_occurrence_id,
            visit_number: diagnosis.visit_number,
            diagnosis_category: diagnosis.diagnosis_category,
            is_principal_diagnosis: diagnosis.is_principal_diagnosis,
            notes: diagnosis.notes,
            created_at: diagnosis.created_at.toISOString(),
            updated_at: diagnosis.updated_at.toISOString(),
            created_by: diagnosis.created_by,
            updated_by: diagnosis.updated_by,
        };
    }
}

