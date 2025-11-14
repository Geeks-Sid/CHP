
/**
 * FHIR Service
 * Service for accessing FHIR resources
 */

import { apiClient } from './api-client';

export interface FHIRPatient {
  resourceType: 'Patient';
  id: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family?: string;
    given?: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
}

export interface FHIREncounter {
  resourceType: 'Encounter';
  id: string;
  status?: string;
  class?: {
    system: string;
    code: string;
    display?: string;
  };
  subject?: {
    reference: string;
  };
  period?: {
    start?: string;
    end?: string;
  };
}

export interface FHIRBundle {
  resourceType: 'Bundle';
  type: string;
  total?: number;
  entry?: Array<{
    resource: FHIRPatient | FHIREncounter;
  }>;
}

/**
 * Get FHIR Patient resource by person ID
 */
export async function getFHIRPatient(personId: number, baseUrl?: string): Promise<FHIRPatient> {
  const params = new URLSearchParams();
  if (baseUrl) params.append('baseUrl', baseUrl);
  const queryString = params.toString();
  return apiClient.get<FHIRPatient>(`/fhir/R4/Patient/${personId}${queryString ? `?${queryString}` : ''}`);
}

/**
 * Search FHIR Patient by identifier (MRN)
 */
export async function searchFHIRPatient(mrn: string, baseUrl?: string): Promise<FHIRBundle> {
  const params = new URLSearchParams();
  params.append('identifier', mrn);
  if (baseUrl) params.append('baseUrl', baseUrl);
  return apiClient.get<FHIRBundle>(`/fhir/R4/Patient?${params.toString()}`);
}

/**
 * Get FHIR Encounter resource by visit ID
 */
export async function getFHIREncounter(visitId: number, baseUrl?: string): Promise<FHIREncounter> {
  const params = new URLSearchParams();
  if (baseUrl) params.append('baseUrl', baseUrl);
  const queryString = params.toString();
  return apiClient.get<FHIREncounter>(`/fhir/R4/Encounter/${visitId}${queryString ? `?${queryString}` : ''}`);
}

