import { Procedure } from '../../procedures/procedures.repository';

/**
 * FHIR Procedure Mapper
 * Maps OMOP procedure_occurrence table to FHIR R4 Procedure resource
 */
export class ProcedureMapper {
    /**
     * Map procedure to FHIR Procedure resource
     */
    static toFhir(procedure: Procedure, baseUrl: string = ''): any {
        const fhirProcedure: any = {
            resourceType: 'Procedure',
            id: procedure.procedure_occurrence_id.toString(),
            meta: {
                versionId: '1',
                lastUpdated: procedure.updated_at.toISOString(),
            },
            status: 'completed',
            subject: {
                reference: `Patient/${procedure.person_id}`,
            },
            performedDateTime: procedure.procedure_date.toISOString(),
            code: {
                coding: [
                    {
                        system: 'http://snomed.info/sct',
                        code: procedure.procedure_concept_id.toString(),
                    },
                ],
            },
        };

        // Encounter reference (if available)
        if (procedure.visit_occurrence_id) {
            fhirProcedure.encounter = {
                reference: `Encounter/${procedure.visit_occurrence_id}`,
            };
        }

        // Type (procedure_type_concept_id)
        if (procedure.procedure_type_concept_id) {
            fhirProcedure.category = [
                {
                    coding: [
                        {
                            system: 'http://snomed.info/sct',
                            code: procedure.procedure_type_concept_id.toString(),
                        },
                    ],
                },
            ];
        }

        return fhirProcedure;
    }
}

