
/**
 * Terminology Service
 * Service for searching and looking up medical concepts
 */

import { apiClient } from './api-client';

export interface Concept {
  concept_id: number;
  concept_name: string;
  concept_code: string;
  vocabulary_id: string;
  domain_id?: string;
}

export interface ConceptListResponse {
  items: Concept[];
  nextCursor?: string;
}

export interface BatchLookupRequest {
  concept_ids?: number[];
  concept_codes?: string[];
}

/**
 * Search concepts with filters
 */
export async function searchConcepts(params: {
  q?: string;
  code?: string;
  system?: string;
  vocabulary_id?: string;
  limit?: number;
  cursor?: string;
}): Promise<ConceptListResponse> {
  const queryParams = new URLSearchParams();
  if (params.q) queryParams.append('q', params.q);
  if (params.code) queryParams.append('code', params.code);
  if (params.system) queryParams.append('system', params.system);
  if (params.vocabulary_id) queryParams.append('vocabulary_id', params.vocabulary_id);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.cursor) queryParams.append('cursor', params.cursor);

  const queryString = queryParams.toString();
  return apiClient.get<ConceptListResponse>(`/terminology/concepts${queryString ? `?${queryString}` : ''}`);
}

/**
 * Batch lookup concepts by IDs or codes
 */
export async function batchLookupConcepts(request: BatchLookupRequest): Promise<Concept[]> {
  return apiClient.post<Concept[]>('/terminology/concepts/batch', request);
}

/**
 * Get concept by ID (using batch lookup)
 */
export async function getConceptById(conceptId: number): Promise<Concept | null> {
  try {
    const concepts = await batchLookupConcepts({ concept_ids: [conceptId] });
    return concepts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get concept by code (using batch lookup)
 */
export async function getConceptByCode(conceptCode: string): Promise<Concept | null> {
  try {
    const concepts = await batchLookupConcepts({ concept_codes: [conceptCode] });
    return concepts[0] || null;
  } catch {
    return null;
  }
}

