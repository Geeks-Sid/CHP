/**
 * Pagination Utility
 * 
 * Provides centralized cursor-based pagination helpers with:
 * - Opaque cursor encoding/decoding
 * - Default page size enforcement
 * - Hard maximum limits
 * - Type-safe cursor data
 */

export interface CursorData {
  [key: string]: string | number | Date | null | undefined;
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginationResult<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

/**
 * Default pagination constants
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Encode cursor data to opaque base64 string
 * 
 * @param data - Cursor data object (typically contains ID and timestamp)
 * @returns Base64-encoded cursor string
 */
export function encodeCursor(data: CursorData): string {
  try {
    const json = JSON.stringify(data);
    return Buffer.from(json, 'utf-8').toString('base64');
  } catch (error) {
    throw new Error('Failed to encode cursor: ' + (error as Error).message);
  }
}

/**
 * Decode opaque cursor string to data object
 * 
 * @param cursor - Base64-encoded cursor string
 * @returns Decoded cursor data object
 * @throws Error if cursor is invalid
 */
export function decodeCursor(cursor: string): CursorData {
  try {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(json) as CursorData;
  } catch (error) {
    throw new Error('Invalid cursor format: ' + (error as Error).message);
  }
}

/**
 * Validate and normalize pagination limit
 * 
 * @param limit - Requested limit
 * @param options - Pagination options with defaults
 * @returns Normalized limit within bounds
 */
export function normalizeLimit(
  limit?: number,
  options?: { defaultLimit?: number; maxLimit?: number },
): number {
  const defaultLimit = options?.defaultLimit ?? PAGINATION_DEFAULTS.DEFAULT_LIMIT;
  const maxLimit = options?.maxLimit ?? PAGINATION_DEFAULTS.MAX_LIMIT;

  if (!limit || limit < PAGINATION_DEFAULTS.MIN_LIMIT) {
    return defaultLimit;
  }

  return Math.min(limit, maxLimit);
}

/**
 * Create pagination result with next cursor
 * 
 * @param items - Items from query (may include one extra for hasMore check)
 * @param limit - Requested limit
 * @param cursorExtractor - Function to extract cursor data from last item
 * @returns Pagination result with items and optional next cursor
 */
export function createPaginationResult<T>(
  items: T[],
  limit: number,
  cursorExtractor?: (item: T) => CursorData,
): PaginationResult<T> {
  const hasMore = items.length > limit;
  const resultItems = hasMore ? items.slice(0, limit) : items;

  let nextCursor: string | undefined;
  if (hasMore && resultItems.length > 0 && cursorExtractor) {
    const lastItem = resultItems[resultItems.length - 1];
    const cursorData = cursorExtractor(lastItem);
    nextCursor = encodeCursor(cursorData);
  }

  return {
    items: resultItems,
    nextCursor,
    hasMore,
  };
}

/**
 * Build cursor-based WHERE clause for SQL queries
 * 
 * @param cursor - Optional cursor string
 * @param cursorField - Field name to use for cursor comparison (e.g., 'created_at', 'id')
 * @param paramIndex - Starting parameter index (default: 1)
 * @param direction - Sort direction ('DESC' or 'ASC', default: 'DESC')
 * @returns Object with WHERE clause and parameters
 */
export function buildCursorCondition(
  cursor?: string,
  cursorField: string = 'created_at',
  paramIndex: number = 1,
  direction: 'DESC' | 'ASC' = 'DESC',
): { condition: string; params: any[]; nextParamIndex: number } {
  if (!cursor) {
    return { condition: '', params: [], nextParamIndex: paramIndex };
  }

  try {
    const cursorData = decodeCursor(cursor);
    const cursorValue = cursorData[cursorField];

    if (cursorValue === undefined || cursorValue === null) {
      return { condition: '', params: [], nextParamIndex: paramIndex };
    }

    // Handle different cursor field types
    let condition: string;
    if (direction === 'DESC') {
      condition = `${cursorField} < $${paramIndex}`;
    } else {
      condition = `${cursorField} > $${paramIndex}`;
    }

    // Handle composite cursors (e.g., (created_at, id))
    if (cursorData.id !== undefined && cursorField !== 'id') {
      condition = `(${cursorField}, id) < ($${paramIndex}, $${paramIndex + 1})`;
      return {
        condition,
        params: [cursorValue, cursorData.id],
        nextParamIndex: paramIndex + 2,
      };
    }

    return {
      condition,
      params: [cursorValue],
      nextParamIndex: paramIndex + 1,
    };
  } catch (error) {
    // Invalid cursor - log warning but don't fail
    console.warn('Invalid cursor provided, ignoring:', error);
    return { condition: '', params: [], nextParamIndex: paramIndex };
  }
}

/**
 * Extract cursor data from entity for pagination
 * Common patterns for different entity types
 */
export const CursorExtractors = {
  /**
   * Extract cursor from entity with id and created_at
   */
  idAndCreatedAt: <T extends { id?: number; created_at?: Date }>(item: T): CursorData => ({
    id: item.id,
    created_at: item.created_at?.toISOString(),
  }),

  /**
   * Extract cursor from entity with person_id
   */
  personId: <T extends { person_id?: number }>(item: T): CursorData => ({
    person_id: item.person_id,
  }),

  /**
   * Extract cursor from entity with visit_occurrence_id
   */
  visitId: <T extends { visit_occurrence_id?: number }>(item: T): CursorData => ({
    visit_occurrence_id: item.visit_occurrence_id,
  }),

  /**
   * Extract cursor from entity with created_at only
   */
  createdAt: <T extends { created_at?: Date }>(item: T): CursorData => ({
    created_at: item.created_at?.toISOString(),
  }),

  /**
   * Extract cursor from entity with uploaded_at
   */
  uploadedAt: <T extends { uploaded_at?: Date; document_id?: string }>(item: T): CursorData => ({
    uploaded_at: item.uploaded_at?.toISOString(),
    document_id: item.document_id,
  }),
};

/**
 * Parse pagination options from query parameters
 * 
 * @param query - Query parameters object
 * @param options - Additional pagination options
 * @returns Normalized pagination options
 */
export function parsePaginationOptions(
  query: { limit?: string | number; cursor?: string },
  options?: { defaultLimit?: number; maxLimit?: number },
): { limit: number; cursor?: string } {
  const limit = query.limit
    ? typeof query.limit === 'string'
      ? parseInt(query.limit, 10)
      : query.limit
    : undefined;

  return {
    limit: normalizeLimit(limit, options),
    cursor: query.cursor,
  };
}

