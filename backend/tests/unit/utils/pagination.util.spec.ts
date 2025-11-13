import {
  encodeCursor,
  decodeCursor,
  normalizeLimit,
  createPaginationResult,
  buildCursorCondition,
  parsePaginationOptions,
  CursorExtractors,
} from '../../../src/utils/pagination.util';

describe('Pagination Utility', () => {
  describe('encodeCursor', () => {
    it('should encode cursor data to base64', () => {
      const data = { id: 123, created_at: '2024-01-15T10:00:00Z' };
      const cursor = encodeCursor(data);

      expect(cursor).toBeDefined();
      expect(typeof cursor).toBe('string');
      expect(cursor.length).toBeGreaterThan(0);
    });

    it('should produce different cursors for different data', () => {
      const data1 = { id: 123 };
      const data2 = { id: 456 };

      const cursor1 = encodeCursor(data1);
      const cursor2 = encodeCursor(data2);

      expect(cursor1).not.toBe(cursor2);
    });
  });

  describe('decodeCursor', () => {
    it('should decode base64 cursor to data', () => {
      const data = { id: 123, created_at: '2024-01-15T10:00:00Z' };
      const cursor = encodeCursor(data);
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(data);
    });

    it('should throw error for invalid cursor', () => {
      expect(() => decodeCursor('invalid-cursor')).toThrow('Invalid cursor format');
    });

    it('should handle empty cursor', () => {
      expect(() => decodeCursor('')).toThrow('Invalid cursor format');
    });
  });

  describe('normalizeLimit', () => {
    it('should return default limit when not provided', () => {
      const limit = normalizeLimit();
      expect(limit).toBe(20); // Default
    });

    it('should return default limit when less than minimum', () => {
      const limit = normalizeLimit(0);
      expect(limit).toBe(20); // Default
    });

    it('should return provided limit when valid', () => {
      const limit = normalizeLimit(50);
      expect(limit).toBe(50);
    });

    it('should cap at max limit', () => {
      const limit = normalizeLimit(200);
      expect(limit).toBe(100); // Max
    });

    it('should use custom defaults', () => {
      const limit = normalizeLimit(undefined, { defaultLimit: 10, maxLimit: 50 });
      expect(limit).toBe(10);
    });

    it('should respect custom max', () => {
      const limit = normalizeLimit(100, { maxLimit: 50 });
      expect(limit).toBe(50);
    });
  });

  describe('createPaginationResult', () => {
    it('should create result without next cursor when no more items', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = createPaginationResult(items, 20);

      expect(result.items).toEqual(items);
      expect(result.nextCursor).toBeUndefined();
      expect(result.hasMore).toBe(false);
    });

    it('should create result with next cursor when more items', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const extractor = (item: { id: number }) => ({ id: item.id });
      const result = createPaginationResult(items, 2, extractor);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeDefined();
      expect(result.hasMore).toBe(true);
    });

    it('should handle empty items array', () => {
      const result = createPaginationResult([], 20);
      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
      expect(result.hasMore).toBe(false);
    });
  });

  describe('buildCursorCondition', () => {
    it('should return empty condition when no cursor', () => {
      const { condition, params } = buildCursorCondition();
      expect(condition).toBe('');
      expect(params).toEqual([]);
    });

    it('should build condition for DESC order', () => {
      const cursor = encodeCursor({ created_at: '2024-01-15T10:00:00Z' });
      const { condition, params } = buildCursorCondition(cursor, 'created_at', 1, 'DESC');

      expect(condition).toContain('created_at <');
      expect(params).toHaveLength(1);
    });

    it('should build condition for ASC order', () => {
      const cursor = encodeCursor({ created_at: '2024-01-15T10:00:00Z' });
      const { condition, params } = buildCursorCondition(cursor, 'created_at', 1, 'ASC');

      expect(condition).toContain('created_at >');
      expect(params).toHaveLength(1);
    });

    it('should handle composite cursor', () => {
      const cursor = encodeCursor({ created_at: '2024-01-15T10:00:00Z', id: 123 });
      const { condition, params, nextParamIndex } = buildCursorCondition(
        cursor,
        'created_at',
        1,
        'DESC',
      );

      expect(condition).toContain('(created_at, id)');
      expect(params).toHaveLength(2);
      expect(nextParamIndex).toBe(3);
    });

    it('should handle invalid cursor gracefully', () => {
      const { condition, params } = buildCursorCondition('invalid-cursor', 'created_at');
      expect(condition).toBe('');
      expect(params).toEqual([]);
    });
  });

  describe('parsePaginationOptions', () => {
    it('should parse string limit', () => {
      const options = parsePaginationOptions({ limit: '50' });
      expect(options.limit).toBe(50);
    });

    it('should parse number limit', () => {
      const options = parsePaginationOptions({ limit: 50 });
      expect(options.limit).toBe(50);
    });

    it('should use default when limit not provided', () => {
      const options = parsePaginationOptions({});
      expect(options.limit).toBe(20);
    });

    it('should parse cursor', () => {
      const cursor = encodeCursor({ id: 123 });
      const options = parsePaginationOptions({ cursor });
      expect(options.cursor).toBe(cursor);
    });

    it('should cap limit at max', () => {
      const options = parsePaginationOptions({ limit: '200' });
      expect(options.limit).toBe(100); // Max
    });
  });

  describe('CursorExtractors', () => {
    it('should extract id and created_at', () => {
      const item = { id: 123, created_at: new Date('2024-01-15T10:00:00Z') };
      const cursor = CursorExtractors.idAndCreatedAt(item);

      expect(cursor.id).toBe(123);
      expect(cursor.created_at).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should extract person_id', () => {
      const item = { person_id: 456 };
      const cursor = CursorExtractors.personId(item);

      expect(cursor.person_id).toBe(456);
    });

    it('should extract visit_occurrence_id', () => {
      const item = { visit_occurrence_id: 789 };
      const cursor = CursorExtractors.visitId(item);

      expect(cursor.visit_occurrence_id).toBe(789);
    });

    it('should extract created_at', () => {
      const item = { created_at: new Date('2024-01-15T10:00:00Z') };
      const cursor = CursorExtractors.createdAt(item);

      expect(cursor.created_at).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should extract uploaded_at and document_id', () => {
      const item = {
        uploaded_at: new Date('2024-01-15T10:00:00Z'),
        document_id: 'doc-123',
      };
      const cursor = CursorExtractors.uploadedAt(item);

      expect(cursor.uploaded_at).toBe('2024-01-15T10:00:00.000Z');
      expect(cursor.document_id).toBe('doc-123');
    });
  });
});

