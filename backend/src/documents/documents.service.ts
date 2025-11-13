import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { logger } from '../common/logger/logger.config';
import {
    CreateDocumentData,
    DocumentsRepository,
    UpdateDocumentData,
} from './documents.repository';
import { S3Service } from './s3/s3.service';

export interface PresignRequest {
    file_name: string;
    content_type: string;
    size_bytes: number;
    patient_person_id?: number;
}

export interface PresignResponse {
    upload_id: string;
    url: string;
    fields?: Record<string, string>;
    expires_at: Date;
}

export interface ConfirmUploadRequest {
    upload_id: string;
    file_path: string;
    checksum?: string;
}

/**
 * Documents Service
 * Business logic for document management
 * Handles presigned URLs, upload confirmation, and access control
 */
@Injectable()
export class DocumentsService {
    // In-memory store for upload metadata (use Redis in production)
    private readonly uploadMetadata = new Map<string, {
        owner_user_id: string;
        patient_person_id?: number;
        file_name: string;
        content_type: string;
        size_bytes: number;
        expires_at: Date;
    }>();

    constructor(
        private readonly documentsRepository: DocumentsRepository,
        private readonly s3Service: S3Service,
    ) {
        // Cleanup expired upload metadata every 30 minutes
        setInterval(() => {
            this.cleanupExpiredMetadata();
        }, 30 * 60 * 1000);
    }

    /**
     * Generate presigned URL for file upload
     * Creates temporary upload metadata
     */
    async presignUpload(
        userId: string,
        request: PresignRequest,
    ): Promise<PresignResponse> {
        // Validate file size (max 100MB)
        const maxSizeBytes = 100 * 1024 * 1024; // 100MB
        if (request.size_bytes > maxSizeBytes) {
            throw new BadRequestException('File size exceeds maximum allowed size (100MB)');
        }

        // Validate content type (basic validation)
        if (!request.content_type || request.content_type.length === 0) {
            throw new BadRequestException('Content type is required');
        }

        // Generate upload ID
        const uploadId = randomUUID();

        // Generate S3 key (path in bucket)
        // Format: documents/{year}/{month}/{upload_id}/{file_name}
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const sanitizedFileName = request.file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `documents/${year}/${month}/${uploadId}/${sanitizedFileName}`;

        // Generate presigned URL (15 minutes expiry)
        const expiresIn = 15 * 60; // 15 minutes
        const presignedResult = await this.s3Service.generatePresignedPutUrl({
            key: s3Key,
            contentType: request.content_type,
            expiresIn,
        });

        // Store upload metadata
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

        this.uploadMetadata.set(uploadId, {
            owner_user_id: userId,
            patient_person_id: request.patient_person_id,
            file_name: request.file_name,
            content_type: request.content_type,
            size_bytes: request.size_bytes,
            expires_at: expiresAt,
        });

        logger.info(
            { uploadId, userId, file_name: request.file_name, s3Key },
            'Presigned URL generated',
        );

        return {
            upload_id: uploadId,
            url: presignedResult.url,
            fields: presignedResult.fields,
            expires_at: presignedResult.expiresAt,
        };
    }

    /**
     * Confirm file upload and create document record
     */
    async confirmUpload(
        userId: string,
        request: ConfirmUploadRequest,
    ) {
        // Retrieve upload metadata
        const metadata = this.uploadMetadata.get(request.upload_id);
        if (!metadata) {
            throw new NotFoundException('Upload ID not found or expired');
        }

        // Verify ownership
        if (metadata.owner_user_id !== userId) {
            throw new ForbiddenException('You do not have permission to confirm this upload');
        }

        // Check if expired
        if (metadata.expires_at < new Date()) {
            this.uploadMetadata.delete(request.upload_id);
            throw new BadRequestException('Upload ID has expired');
        }

        // Create document record
        const createData: CreateDocumentData = {
            owner_user_id: metadata.owner_user_id,
            patient_person_id: metadata.patient_person_id,
            file_path: request.file_path,
            file_name: metadata.file_name,
            content_type: metadata.content_type,
            size_bytes: metadata.size_bytes,
            uploaded_by: userId,
        };

        try {
            const document = await this.documentsRepository.createDocument(createData);

            // Cleanup metadata
            this.uploadMetadata.delete(request.upload_id);

            logger.info(
                { documentId: document.document_id, uploadId: request.upload_id, userId },
                'Document upload confirmed',
            );

            return document;
        } catch (error: any) {
            logger.error({ error, uploadId: request.upload_id }, 'Failed to confirm upload');
            throw error;
        }
    }

    /**
     * Get document by ID with access control
     * Returns document metadata and presigned GET URL
     */
    async getDocument(documentId: string, userId: string, userRoles: string[]): Promise<{
        document: any;
        download_url?: string;
    }> {
        const document = await this.documentsRepository.findById(documentId);
        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Check access permissions
        // Owner can always access
        // Users with document.read permission can access
        // For patient documents, additional checks may be needed
        const isOwner = document.owner_user_id === userId;
        const hasReadPermission = userRoles.includes('document.read');

        if (!isOwner && !hasReadPermission) {
            throw new ForbiddenException('You do not have permission to access this document');
        }

        // Generate presigned GET URL (1 hour expiry)
        let downloadUrl: string | undefined;
        try {
            downloadUrl = await this.s3Service.generatePresignedGetUrl(document.file_path, 3600);
        } catch (error: any) {
            logger.warn({ error, documentId, file_path: document.file_path }, 'Failed to generate download URL');
            // Don't fail the request if URL generation fails
        }

        return {
            document,
            download_url: downloadUrl,
        };
    }

    /**
     * Search documents with filters
     * Applies access control
     */
    async searchDocuments(
        userId: string,
        userRoles: string[],
        filters: {
            patient_person_id?: number;
            owner_user_id?: string;
            limit?: number;
            cursor?: string;
        },
    ) {
        // Access control: users can only see their own documents unless they have document.read permission
        const hasReadPermission = userRoles.includes('document.read');
        if (!hasReadPermission) {
            // Restrict to own documents
            filters.owner_user_id = userId;
        }

        const result = await this.documentsRepository.searchDocuments({
            owner_user_id: filters.owner_user_id,
            patient_person_id: filters.patient_person_id,
            limit: filters.limit,
            cursor: filters.cursor,
            include_deleted: false,
        });

        return {
            items: result.documents,
            nextCursor: result.nextCursor,
        };
    }

    /**
     * Delete document (soft delete)
     */
    async deleteDocument(documentId: string, userId: string, userRoles: string[]): Promise<void> {
        const document = await this.documentsRepository.findById(documentId);
        if (!document) {
            throw new NotFoundException('Document not found');
        }

        // Check permissions
        const isOwner = document.owner_user_id === userId;
        const hasDeletePermission = userRoles.includes('document.delete');

        if (!isOwner && !hasDeletePermission) {
            throw new ForbiddenException('You do not have permission to delete this document');
        }

        await this.documentsRepository.softDelete(documentId);
        logger.info({ documentId, userId }, 'Document deleted');
    }

    /**
     * Cleanup expired upload metadata
     */
    private cleanupExpiredMetadata(): void {
        const now = new Date();
        let cleaned = 0;

        for (const [uploadId, metadata] of this.uploadMetadata.entries()) {
            if (metadata.expires_at < now) {
                this.uploadMetadata.delete(uploadId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug({ cleaned }, 'Cleaned up expired upload metadata');
        }
    }
}

