import { Visit } from '../../visits/visits.repository';

/**
 * FHIR Encounter Mapper
 * Maps OMOP visit_occurrence table to FHIR R4 Encounter resource
 */
export class EncounterMapper {
    /**
     * Map visit to FHIR Encounter resource
     */
    static toFhir(visit: Visit, baseUrl: string = ''): any {
        const encounter: any = {
            resourceType: 'Encounter',
            id: visit.visit_occurrence_id.toString(),
            meta: {
                versionId: '1',
                lastUpdated: visit.updated_at.toISOString(),
            },
            status: visit.visit_end ? 'finished' : 'in-progress',
            class: {
                system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
                code: this.mapVisitTypeToFhirClass(visit.visit_type),
                display: this.mapVisitTypeToDisplay(visit.visit_type),
            },
            subject: {
                reference: `Patient/${visit.person_id}`,
            },
            period: {
                start: visit.visit_start.toISOString(),
            },
            identifier: [
                {
                    system: `${baseUrl}/fhir/R4/CodeSystem/visit-number`,
                    value: visit.visit_number,
                },
            ],
        };

        // End date if available
        if (visit.visit_end) {
            encounter.period.end = visit.visit_end.toISOString();
        }

        // Type (from visit_concept_id - would need concept lookup in production)
        encounter.type = [
            {
                coding: [
                    {
                        system: 'http://snomed.info/sct',
                        code: visit.visit_concept_id.toString(),
                    },
                ],
            },
        ];

        // Reason (if available)
        if (visit.reason) {
            encounter.reasonCode = [
                {
                text: visit.reason,
                },
            ];
        }

        // Provider (if available)
        if (visit.provider_id) {
            encounter.participant = [
                {
                    type: [
                        {
                            coding: [
                                {
                                    system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
                                    code: 'ATND',
                                    display: 'attending',
                                },
                            ],
                        },
                    ],
                    individual: {
                        reference: `Practitioner/${visit.provider_id}`,
                    },
                },
            ];
        }

        return encounter;
    }

    /**
     * Map visit type to FHIR encounter class code
     */
    private static mapVisitTypeToFhirClass(visitType: string): string {
        const mapping: Record<string, string> = {
            OPD: 'AMB', // Ambulatory
            IPD: 'IMP', // Inpatient encounter
            ER: 'EMER', // Emergency
        };
        return mapping[visitType] || 'AMB';
    }

    /**
     * Map visit type to display name
     */
    private static mapVisitTypeToDisplay(visitType: string): string {
        const mapping: Record<string, string> = {
            OPD: 'Ambulatory',
            IPD: 'Inpatient',
            ER: 'Emergency',
        };
        return mapping[visitType] || 'Ambulatory';
    }
}

