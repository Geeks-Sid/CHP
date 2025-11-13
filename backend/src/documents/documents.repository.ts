import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface CreateDocumentData {
    owner_user_id: string;
    patient_person_id?: number;
    file_path: string;
    file_name?: string;
    content_type?: string;
    size_bytes?: number;
    uploaded_by: string;
}

export interface UpdateDocumentData {
    file_name?: string;
    content_type?: string;
    size_bytes?: number;
    patient_person_id?: number;
}

export interface Document {
    document_id: string;
    owner_user_id: string;
    patient_person_id?: number;
    file_path: string;
    file_name?: string;
    content_type?: string;
    size_bytes?: number;
    uploaded_by?: string;
    uploaded_at: Date;
    deleted_at?: Date;
}

export interface DocumentSearchFilters {
    owner_user_id?: string;
    patient_person_id?: number;
    include_deleted?: boolean;
    limit?: number;
    cursor?: string;
}

/**
 * Documents Repository
 * Handles all database operations for documents
 * Supports soft delete
 */
@Injectable()
export class DocumentsRepository {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Create a new document record
     * Uses transaction for atomicity
     */
    async createDocument(data: CreateDocumentData): Promise<Document> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Insert document
            const { rows } = await client.query<Document>(
                `INSERT INTO document (
          owner_user_id, patient_person_id, file_path, file_name,
          content_type, size_bytes, uploaded_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING document_id, owner_user_id, patient_person_id, file_path, file_name,
                  content_type, size_bytes, uploaded_by, uploaded_at, deleted_at`,
                [
                    data.owner_user_id,
                    data.patient_person_id || null,
                    data.file_path,
                    data.file_name || null,
                    data.content_type || null,
                    data.size_bytes || null,
                    data.uploaded_by,
                ],
            );

            logger.debug({ documentId: rows[0].document_id, ownerUserId: data.owner_user_id }, 'Document created');
            return rows[0];
        });
    }

    /**
     * Find document by ID
     * Excludes soft-deleted documents by default
     */
    async findById(documentId: string, includeDeleted: boolean = false): Promise<Document | null> {
        let query = `
      SELECT document_id, owner_user_id, patient_person_id, file_path, file_name,
             content_type, size_bytes, uploaded_by, uploaded_at, deleted_at
      FROM document
      WHERE document_id = $1
    `;

        const params: any[] = [documentId];

        if (!includeDeleted) {
            query += ` AND deleted_at IS NULL`;
        }

        const { rows } = await this.databaseService.query<Document>(query, params);

        return rows[0] || null;
    }

    /**
     * Update document
     */
    async updateDocument(documentId: string, data: UpdateDocumentData): Promise<Document> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            // Build update query dynamically
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.file_name !== undefined) {
                updates.push(`file_name = $${paramIndex++}`);
                values.push(data.file_name || null);
            }

            if (data.content_type !== undefined) {
                updates.push(`content_type = $${paramIndex++}`);
                values.push(data.content_type || null);
            }

            if (data.size_bytes !== undefined) {
                updates.push(`size_bytes = $${paramIndex++}`);
                values.push(data.size_bytes || null);
            }

            if (data.patient_person_id !== undefined) {
                updates.push(`patient_person_id = $${paramIndex++}`);
                values.push(data.patient_person_id || null);
            }

            if (updates.length === 0) {
                // No updates, just return existing document
                const document = await this.findById(documentId);
                if (!document) {
                    throw new Error('DOCUMENT_NOT_FOUND');
                }
                return document;
            }

            values.push(documentId);

            const { rows } = await client.query<Document>(
                `UPDATE document
         SET ${updates.join(', ')}
         WHERE document_id = $${paramIndex}
           AND deleted_at IS NULL
         RETURNING document_id, owner_user_id, patient_person_id, file_path, file_name,
                   content_type, size_bytes, uploaded_by, uploaded_at, deleted_at`,
                values,
            );

            if (rows.length === 0) {
                throw new Error('DOCUMENT_NOT_FOUND');
            }

            logger.debug({ documentId }, 'Document updated');
            return rows[0];
        });
    }

    /**
     * Soft delete a document
     */
    async softDelete(documentId: string): Promise<void> {
        return this.databaseService.withTransaction(async (client: PoolClient) => {
            const { rowCount } = await client.query(
                `UPDATE document
         SET deleted_at = now()
         WHERE document_id = $1
           AND deleted_at IS NULL`,
                [documentId],
            );

            if (rowCount === 0) {
                throw new Error('DOCUMENT_NOT_FOUND');
            }

            logger.debug({ documentId }, 'Document soft deleted');
        });
    }

    /**
     * Search documents with filters
     * Supports owner, patient, and pagination
     */
    async searchDocuments(filters: DocumentSearchFilters): Promise<{
        documents: Document[];
        nextCursor?: string;
    }> {
        const limit = Math.min(filters.limit || 20, 100);
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        // Cursor-based pagination
        if (filters.cursor) {
            try {
                const decoded = Buffer.from(filters.cursor, 'base64').toString('utf-8');
                const cursorData = JSON.parse(decoded);
                // Use uploaded_at for cursor (descending order)
                conditions.push(`(uploaded_at, document_id) < ($${paramIndex++}, $${paramIndex++})`);
                params.push(cursorData.uploaded_at, cursorData.document_id);
            } catch (error) {
                logger.warn({ error, cursor: filters.cursor }, 'Invalid cursor');
            }
        }

        // Filter by owner
        if (filters.owner_user_id) {
            conditions.push(`owner_user_id = $${paramIndex++}`);
            params.push(filters.owner_user_id);
        }

        // Filter by patient
        if (filters.patient_person_id) {
            conditions.push(`patient_person_id = $${paramIndex++}`);
            params.push(filters.patient_person_id);
        }

        // Soft delete filter
        if (!filters.include_deleted) {
            conditions.push(`deleted_at IS NULL`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get documents (fetch one extra to check for next page)
        params.push(limit + 1);
        const { rows } = await this.databaseService.query<Document>(
            `SELECT document_id, owner_user_id, patient_person_id, file_path, file_name,
              content_type, size_bytes, uploaded_by, uploaded_at, deleted_at
       FROM document
       ${whereClause}
       ORDER BY uploaded_at DESC, document_id DESC
       LIMIT $${paramIndex}`,
            params,
        );

        const hasMore = rows.length > limit;
        const documents = hasMore ? rows.slice(0, limit) : rows;

        // Generate next cursor
        let nextCursor: string | undefined;
        if (hasMore && documents.length > 0) {
            const lastDocument = documents[documents.length - 1];
            const cursorData = {
                uploaded_at: lastDocument.uploaded_at.toISOString(),
                document_id: lastDocument.document_id,
            };
            nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
        }

        return {
            documents,
            nextCursor,
        };
    }
}

