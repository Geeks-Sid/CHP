import { Medication } from '../../medications/medications.repository';

/**
 * FHIR MedicationStatement Mapper
 * Maps OMOP drug_exposure table to FHIR R4 MedicationStatement resource
 */
export class MedicationMapper {
    /**
     * Map medication to FHIR MedicationStatement resource
     */
    static toFhir(medication: Medication, baseUrl: string = ''): any {
        const medicationStatement: any = {
            resourceType: 'MedicationStatement',
            id: medication.drug_exposure_id.toString(),
            meta: {
                versionId: '1',
                lastUpdated: medication.updated_at.toISOString(),
            },
            status: medication.drug_exposure_end ? 'completed' : 'active',
            subject: {
                reference: `Patient/${medication.person_id}`,
            },
            effectivePeriod: {
                start: medication.drug_exposure_start.toISOString(),
            },
            medicationCodeableConcept: {
                coding: [
                    {
                        system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                        code: medication.drug_concept_id.toString(),
                    },
                ],
            },
        };

        // End date if available
        if (medication.drug_exposure_end) {
            medicationStatement.effectivePeriod.end = medication.drug_exposure_end.toISOString();
        }

        // Encounter reference (if available)
        if (medication.visit_occurrence_id) {
            medicationStatement.context = {
                reference: `Encounter/${medication.visit_occurrence_id}`,
            };
        }

        // Quantity
        if (medication.quantity !== null && medication.quantity !== undefined) {
            medicationStatement.dosage = [
                {
                    quantity: {
                        value: medication.quantity,
                    },
                },
            ];
        }

        // Instructions
        if (medication.instructions) {
            if (!medicationStatement.dosage) {
                medicationStatement.dosage = [{}];
            }
            medicationStatement.dosage[0].patientInstruction = medication.instructions;
        }

        // Type (drug_type_concept_id)
        if (medication.drug_type_concept_id) {
            medicationStatement.category = [
                {
                    coding: [
                        {
                            system: 'http://terminology.hl7.org/CodeSystem/medication-statement-category',
                            code: medication.drug_type_concept_id.toString(),
                        },
                    ],
                },
            ];
        }

        return medicationStatement;
    }
}

