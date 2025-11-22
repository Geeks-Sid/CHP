import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../../common/logger/logger.config';
import { Configuration } from '../../config/configuration';

export interface PresignedUrlOptions {
    key: string;
    contentType: string;
    expiresIn?: number; // seconds, default 15 minutes
}

export interface PresignedUrlResult {
    url: string;
    fields?: Record<string, string>; // For POST form fields (if using POST instead of PUT)
    expiresAt: Date;
}

/**
 * S3 Service
 * Handles S3/MinIO operations including presigned URLs
 * Supports server-side encryption
 */
@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;
    private readonly bucket: string;
    private readonly region: string;

    constructor(private readonly configService: ConfigService<Configuration>) {
        const endpoint = this.configService.get('S3_ENDPOINT', { infer: true }) || 'http://localhost:9000';
        const accessKeyId = this.configService.get('S3_ACCESS_KEY', { infer: true }) || 'minio';
        const secretAccessKey = this.configService.get('S3_SECRET_KEY', { infer: true }) || 'minio123';
        this.bucket = this.configService.get('S3_BUCKET', { infer: true }) || 'documents';
        this.region = this.configService.get('S3_REGION', { infer: true }) || 'us-east-1';

        // Configure S3 client
        // For MinIO, we need to set forcePathStyle
        const isMinIO = endpoint && !endpoint.includes('amazonaws.com');

        this.s3Client = new S3Client({
            endpoint: endpoint as any,
            region: this.region,
            credentials: {
                accessKeyId: accessKeyId as any,
                secretAccessKey: secretAccessKey as any,
            },
            forcePathStyle: isMinIO, // Required for MinIO
        } as any);

        logger.info({ endpoint, bucket: this.bucket, region: this.region }, 'S3 client initialized');
    }

    /**
     * Generate a presigned PUT URL for uploading a file
     * Includes server-side encryption headers
     */
    async generatePresignedPutUrl(options: PresignedUrlOptions): Promise<PresignedUrlResult> {
        const { key, contentType, expiresIn = 900 } = options; // Default 15 minutes

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
            // Server-side encryption (SSE-S3)
            ServerSideEncryption: 'AES256',
            // Additional metadata
            Metadata: {
                'uploaded-at': new Date().toISOString(),
            },
        });

        try {
            const url = await getSignedUrl(this.s3Client, command, { expiresIn });

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

            logger.debug({ key, contentType, expiresIn }, 'Presigned PUT URL generated');

            return {
                url,
                expiresAt,
            };
        } catch (error: any) {
            logger.error({ error, key, contentType }, 'Failed to generate presigned URL');
            throw new Error(`Failed to generate presigned URL: ${error.message}`);
        }
    }

    /**
     * Generate a presigned GET URL for downloading a file
     */
    async generatePresignedGetUrl(key: string, expiresIn: number = 3600): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        try {
            const url = await getSignedUrl(this.s3Client, command, { expiresIn });
            logger.debug({ key, expiresIn }, 'Presigned GET URL generated');
            return url;
        } catch (error: any) {
            logger.error({ error, key }, 'Failed to generate presigned GET URL');
            throw new Error(`Failed to generate presigned GET URL: ${error.message}`);
        }
    }

    /**
     * Get the S3 client instance (for advanced operations)
     */
    getClient(): S3Client {
        return this.s3Client;
    }

    /**
     * Get the bucket name
     */
    getBucket(): string {
        return this.bucket;
    }
}

