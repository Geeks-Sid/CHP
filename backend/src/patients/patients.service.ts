import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { logger } from '../common/logger/logger.config';
import {
    CreatePersonData,
    PatientsRepository,
    UpdatePersonData,
} from './patients.repository';

/**
 * Patients Service
 * Business logic for patient management
 */
@Injectable()
export class PatientsService {
    constructor(private readonly patientsRepository: PatientsRepository) { }

    /**
     * Create a new patient
     * Validates DOB and generates MRN
     */
    async createPatient(data: {
        user_id?: string;
        first_name?: string;
        last_name?: string;
        gender_concept_id: number;
        dob: string;
        race_concept_id?: number;
        ethnicity_concept_id?: number;
        person_source_value?: string;
        contact?: {
            phone?: string;
            email?: string;
        };
    }) {
        // Parse and validate DOB
        const dob = new Date(data.dob);
        if (isNaN(dob.getTime())) {
            throw new BadRequestException('Invalid date of birth');
        }

        // Check if DOB is in the future
        if (dob > new Date()) {
            throw new BadRequestException('Date of birth cannot be in the future');
        }

        // Check if DOB is too far in the past (reasonable limit: 150 years)
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 150);
        if (dob < minDate) {
            throw new BadRequestException('Date of birth is too far in the past');
        }

        const createData: CreatePersonData = {
            user_id: data.user_id,
            first_name: data.first_name,
            last_name: data.last_name,
            gender_concept_id: data.gender_concept_id,
            year_of_birth: dob.getUTCFullYear(),
            month_of_birth: dob.getUTCMonth() + 1,
            day_of_birth: dob.getUTCDate(),
            birth_datetime: dob,
            race_concept_id: data.race_concept_id,
            ethnicity_concept_id: data.ethnicity_concept_id,
            person_source_value: data.person_source_value,
            // Note: Contact information accepted but not stored (requires additional table/columns)
        };

        try {
            const person = await this.patientsRepository.createPerson(createData);
            logger.info({ personId: person.person_id, mrn: person.mrn }, 'Patient created');
            return person;
        } catch (error: any) {
            if (error.message === 'USER_ALREADY_LINKED') {
                throw new ConflictException('User is already linked to another patient');
            }
            throw error;
        }
    }

    /**
     * Get patient by ID
     */
    async getPatientById(personId: number) {
        const person = await this.patientsRepository.findById(personId);
        if (!person) {
            throw new NotFoundException('Patient not found');
        }
        return person;
    }

    /**
     * Get patient by MRN
     */
    async getPatientByMRN(mrn: string) {
        const person = await this.patientsRepository.findByMRN(mrn);
        if (!person) {
            throw new NotFoundException('Patient not found');
        }
        return person;
    }

    /**
     * Update patient
     */
    async updatePatient(
        personId: number,
        data: {
            first_name?: string;
            last_name?: string;
            gender_concept_id?: number;
            dob?: string;
            race_concept_id?: number;
            ethnicity_concept_id?: number;
            person_source_value?: string;
            contact?: {
                phone?: string;
                email?: string;
            };
        },
    ) {
        // Check if patient exists
        const existingPatient = await this.patientsRepository.findById(personId);
        if (!existingPatient) {
            throw new NotFoundException('Patient not found');
        }

        const updateData: UpdatePersonData = {};

        if (data.first_name !== undefined) {
            updateData.first_name = data.first_name;
        }

        if (data.last_name !== undefined) {
            updateData.last_name = data.last_name;
        }

        if (data.gender_concept_id !== undefined) {
            updateData.gender_concept_id = data.gender_concept_id;
        }

        if (data.dob !== undefined) {
            const dob = new Date(data.dob);
            if (isNaN(dob.getTime())) {
                throw new BadRequestException('Invalid date of birth');
            }

            if (dob > new Date()) {
                throw new BadRequestException('Date of birth cannot be in the future');
            }

            updateData.year_of_birth = dob.getUTCFullYear();
            updateData.month_of_birth = dob.getUTCMonth() + 1;
            updateData.day_of_birth = dob.getUTCDate();
            updateData.birth_datetime = dob;
        }

        if (data.race_concept_id !== undefined) {
            updateData.race_concept_id = data.race_concept_id;
        }

        if (data.ethnicity_concept_id !== undefined) {
            updateData.ethnicity_concept_id = data.ethnicity_concept_id;
        }

        if (data.person_source_value !== undefined) {
            updateData.person_source_value = data.person_source_value;
        }

        // Note: Contact information accepted but not stored (requires additional table/columns)

        try {
            const person = await this.patientsRepository.updatePerson(personId, updateData);
            logger.info({ personId }, 'Patient updated');
            return person;
        } catch (error: any) {
            if (error.message === 'PERSON_NOT_FOUND') {
                throw new NotFoundException('Patient not found');
            }
            throw error;
        }
    }

    /**
     * Search patients with filters
     */
    async searchPatients(params: {
        limit?: number;
        cursor?: string;
        search?: string;
        dob?: string;
        gender_concept_id?: number;
    }) {
        const limit = Math.min(params.limit || 20, 100); // Max 100 per page

        const result = await this.patientsRepository.searchPersons({
            limit,
            cursor: params.cursor,
            search: params.search,
            dob: params.dob,
            gender_concept_id: params.gender_concept_id,
        });

        return {
            items: result.persons,
            nextCursor: result.nextCursor,
        };
    }
}

