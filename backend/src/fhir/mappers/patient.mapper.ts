import { Person } from '../../patients/patients.repository';

/**
 * FHIR Patient Mapper
 * Maps OMOP person table to FHIR R4 Patient resource
 */
export class PatientMapper {
    /**
     * Map person to FHIR Patient resource
     */
    static toFhir(person: Person, baseUrl: string = ''): any {
        const patient: any = {
            resourceType: 'Patient',
            id: person.person_id.toString(),
            meta: {
                versionId: '1',
                lastUpdated: person.updated_at.toISOString(),
            },
            identifier: [
                {
                    system: `${baseUrl}/fhir/R4/CodeSystem/mrn`,
                    value: person.mrn,
                    type: {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                                code: 'MR',
                                display: 'Medical Record Number',
                            },
                        ],
                    },
                },
            ],
        };

        // Name
        if (person.first_name || person.last_name) {
            patient.name = [
                {
                    use: 'official',
                    family: person.last_name || '',
                    given: person.first_name ? [person.first_name] : [],
                },
            ];
        }

        // Gender
        // Common gender concept IDs: 8507 = Male, 8532 = Female, 8570 = Other
        let gender = 'unknown';
        if (person.gender_concept_id === 8507) {
            gender = 'male';
        } else if (person.gender_concept_id === 8532) {
            gender = 'female';
        } else if (person.gender_concept_id === 8570) {
            gender = 'other';
        }
        patient.gender = gender;

        // Birth date
        if (person.birth_datetime) {
            patient.birthDate = this.formatBirthDate(person.birth_datetime);
        } else if (person.year_of_birth) {
            // Construct date from year/month/day
            const year = person.year_of_birth;
            const month = person.month_of_birth ? String(person.month_of_birth).padStart(2, '0') : '01';
            const day = person.day_of_birth ? String(person.day_of_birth).padStart(2, '0') : '01';
            patient.birthDate = `${year}-${month}-${day}`;
        }

        // Extension for race and ethnicity (if available)
        const extensions: any[] = [];

        if (person.race_concept_id) {
            extensions.push({
                url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race',
                extension: [
                    {
                        url: 'ombCategory',
                        valueCoding: {
                            system: 'urn:oid:2.16.840.1.113883.6.238',
                            code: person.race_concept_id.toString(),
                        },
                    },
                ],
            });
        }

        if (person.ethnicity_concept_id) {
            extensions.push({
                url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity',
                extension: [
                    {
                        url: 'ombCategory',
                        valueCoding: {
                            system: 'urn:oid:2.16.840.1.113883.6.238',
                            code: person.ethnicity_concept_id.toString(),
                        },
                    },
                ],
            });
        }

        if (extensions.length > 0) {
            patient.extension = extensions;
        }

        return patient;
    }

    /**
     * Format birth date from Date object
     */
    private static formatBirthDate(date: Date): string {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

