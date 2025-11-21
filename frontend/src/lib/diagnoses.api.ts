/**
 * Diagnoses API
 * API client methods for diagnosis operations
 */

import { apiClient } from './api-client';

export interface Diagnosis {
  condition_occurrence_id: number;
  person_id: number;
  condition_concept_id: number;
  condition_concept_name?: string;
  condition_concept_code?: string;
  condition_start_date: string;
  condition_start_datetime?: string;
  condition_end_date?: string;
  condition_end_datetime?: string;
  condition_type_concept_id: number;
  condition_type_name?: string;
  condition_status_concept_id?: number;
  condition_status_name?: string;
  stop_reason?: string;
  provider_id?: string;
  provider_name?: string;
  visit_occurrence_id?: number;
  visit_number?: string;
  diagnosis_category?: string;
  is_principal_diagnosis: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CreateDiagnosisDto {
  person_id: number;
  condition_concept_id: number;
  condition_start_date: string;
  condition_start_datetime?: string;
  condition_end_date?: string;
  condition_end_datetime?: string;
  condition_type_concept_id: number;
  condition_status_concept_id?: number;
  stop_reason?: string;
  provider_id?: string;
  visit_occurrence_id?: number;
  condition_source_value?: string;
  diagnosis_category?: 'Primary' | 'Additional';
  is_principal_diagnosis?: boolean;
  notes?: string;
}

export interface UpdateDiagnosisDto {
  condition_concept_id?: number;
  condition_start_date?: string;
  condition_start_datetime?: string;
  condition_end_date?: string;
  condition_end_datetime?: string;
  condition_type_concept_id?: number;
  condition_status_concept_id?: number;
  stop_reason?: string;
  provider_id?: string;
  visit_occurrence_id?: number;
  condition_source_value?: string;
  diagnosis_category?: 'Primary' | 'Additional';
  is_principal_diagnosis?: boolean;
  notes?: string;
}

export interface DiagnosisListResponse {
  items: Diagnosis[];
  nextCursor?: string;
}

export const diagnosesApi = {
  /**
   * Create a new diagnosis
   */
  create: (data: CreateDiagnosisDto): Promise<Diagnosis> =>
    apiClient.post<Diagnosis>('/diagnoses', data),

  /**
   * Get diagnosis by ID
   */
  getById: (id: number): Promise<Diagnosis> =>
    apiClient.get<Diagnosis>(`/diagnoses/${id}`),

  /**
   * Get diagnoses by patient ID
   */
  getByPatient: (personId: number, filters?: { active_only?: boolean; visit_id?: number }): Promise<Diagnosis[]> => {
    const params = new URLSearchParams();
    if (filters?.active_only) {
      params.append('active_only', 'true');
    }
    if (filters?.visit_id) {
      params.append('visit_id', filters.visit_id.toString());
    }
    const queryString = params.toString();
    return apiClient.get<Diagnosis[]>(`/diagnoses/patient/${personId}${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get diagnoses by visit ID
   */
  getByVisit: (visitId: number): Promise<Diagnosis[]> =>
    apiClient.get<Diagnosis[]>(`/diagnoses/visit/${visitId}`),

  /**
   * Search diagnoses with filters
   */
  search: (filters?: {
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
  }): Promise<DiagnosisListResponse> => {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.cursor) params.append('cursor', filters.cursor);
    if (filters?.person_id) params.append('person_id', filters.person_id.toString());
    if (filters?.visit_occurrence_id) params.append('visit_occurrence_id', filters.visit_occurrence_id.toString());
    if (filters?.active_only) params.append('active_only', 'true');
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    if (filters?.condition_type_concept_id) params.append('condition_type_concept_id', filters.condition_type_concept_id.toString());
    if (filters?.is_principal_diagnosis !== undefined) params.append('is_principal_diagnosis', filters.is_principal_diagnosis.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    return apiClient.get<DiagnosisListResponse>(`/diagnoses${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Update diagnosis
   */
  update: (id: number, data: UpdateDiagnosisDto): Promise<Diagnosis> =>
    apiClient.patch<Diagnosis>(`/diagnoses/${id}`, data),

  /**
   * Set diagnosis as principal for a visit
   */
  setPrincipal: (id: number, visitId: number): Promise<Diagnosis> =>
    apiClient.patch<Diagnosis>(`/diagnoses/${id}/principal`, { visit_id: visitId }),

  /**
   * Delete diagnosis
   */
  delete: (id: number): Promise<void> =>
    apiClient.delete(`/diagnoses/${id}`),
};

