import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { logger } from '../../common/logger/logger.config';
import { DatabaseService } from '../../database/database.service';

/**
 * Audit Interceptor
 * Captures read/write events and stores them in audit_log
 * Uses async queue to avoid blocking requests
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
    private readonly auditQueue: Array<{
        userId?: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        ip?: string;
        userAgent?: string;
        details: any;
    }> = [];

    private processingQueue = false;

    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) {
        // Process audit queue every 5 seconds
        setInterval(() => {
            this.processAuditQueue();
        }, 5000);
    }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        const handler = context.getHandler();
        const controller = context.getClass();

        // Extract user from request (set by JwtAuthGuard)
        const user = (request as any).user;
        const userId = user?.userId;

        // Determine action from HTTP method
        const method = request.method.toUpperCase();
        const action = this.mapMethodToAction(method);

        // Determine resource type from controller/route
        const resourceType = this.extractResourceType(controller.name, request.url);

        // Extract resource ID from params or body
        const resourceId = this.extractResourceId(request);

        // Extract IP and User-Agent
        const ip = this.extractIp(request);
        const userAgent = request.headers['user-agent'];

        // Determine if this is a write operation (should always be logged)
        const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        // Determine if this is a read operation (may be sampled)
        const isReadOperation = method === 'GET';

        return next.handle().pipe(
            tap({
                next: () => {
                    // Log successful operations
                    this.logAuditEvent({
                        userId,
                        action,
                        resourceType,
                        resourceId,
                        ip,
                        userAgent,
                        details: {
                            method,
                            url: request.url,
                            status: 'success',
                        },
                    }, isWriteOperation, isReadOperation);
                },
                error: (error) => {
                    // Log failed operations (always log errors)
                    this.logAuditEvent({
                        userId,
                        action,
                        resourceType,
                        resourceId,
                        ip,
                        userAgent,
                        details: {
                            method,
                            url: request.url,
                            status: 'error',
                            error: error.message,
                            errorType: error.constructor.name,
                        },
                    }, true, false); // Always log errors
                },
            }),
        );
    }

    /**
     * Map HTTP method to audit action
     */
    private mapMethodToAction(method: string): string {
        const mapping: Record<string, string> = {
            GET: 'READ',
            POST: 'CREATE',
            PUT: 'UPDATE',
            PATCH: 'UPDATE',
            DELETE: 'DELETE',
        };
        return mapping[method] || 'READ';
    }

    /**
     * Extract resource type from controller name and URL
     */
    private extractResourceType(controllerName: string, url: string): string {
        // Remove "Controller" suffix
        const resource = controllerName.replace('Controller', '').toLowerCase();

        // Try to extract from URL path
        const urlMatch = url.match(/\/([^\/]+)(?:\/|$)/);
        if (urlMatch) {
            return urlMatch[1];
        }

        return resource || 'unknown';
    }

    /**
     * Extract resource ID from request params or body
     */
    private extractResourceId(request: FastifyRequest): string | undefined {
        // Try params first
        const params = (request as any).params;
        if (params) {
            const idKeys = ['id', 'person_id', 'visit_id', 'document_id', 'user_id'];
            for (const key of idKeys) {
                if (params[key]) {
                    return String(params[key]);
                }
            }
        }

        // Try body
        const body = (request as any).body;
        if (body) {
            const idKeys = ['id', 'person_id', 'visit_id', 'document_id', 'user_id'];
            for (const key of idKeys) {
                if (body[key]) {
                    return String(body[key]);
                }
            }
        }

        return undefined;
    }

    /**
     * Extract IP address from request
     */
    private extractIp(request: FastifyRequest): string | undefined {
        // Check X-Forwarded-For header (for proxies/load balancers)
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
            return Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
        }

        // Check X-Real-IP header
        const realIp = request.headers['x-real-ip'];
        if (realIp) {
            return Array.isArray(realIp) ? realIp[0] : realIp;
        }

        // Fallback to request IP
        return request.ip;
    }

    /**
     * Log audit event (with sampling for reads)
     */
    private logAuditEvent(
        event: {
            userId?: string;
            action: string;
            resourceType: string;
            resourceId?: string;
            ip?: string;
            userAgent?: string;
            details: any;
        },
        alwaysLog: boolean,
        isReadOperation: boolean,
    ): void {
        // Always log write operations and errors
        if (alwaysLog) {
            this.enqueueAuditEvent(event);
            return;
        }

        // Sample read operations (10% by default)
        if (isReadOperation) {
            const sampleRate = parseFloat(process.env.AUDIT_READ_SAMPLE_RATE || '0.1');
            if (Math.random() < sampleRate) {
                this.enqueueAuditEvent(event);
            }
        }
    }

    /**
     * Enqueue audit event for async processing
     */
    private enqueueAuditEvent(event: {
        userId?: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        ip?: string;
        userAgent?: string;
        details: any;
    }): void {
        this.auditQueue.push(event);

        // If queue is getting large, process immediately
        if (this.auditQueue.length > 1000) {
            this.processAuditQueue();
        }
    }

    /**
     * Process audit queue and insert into database
     */
    private async processAuditQueue(): Promise<void> {
        if (this.processingQueue || this.auditQueue.length === 0) {
            return;
        }

        this.processingQueue = true;

        try {
            const events = this.auditQueue.splice(0, 100); // Process up to 100 at a time

            if (events.length === 0) {
                return;
            }

            // Use database function for efficient bulk insert
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');

                for (const event of events) {
                    await client.query(
                        `SELECT log_audit($1, $2, $3, $4, $5::INET, $6, $7::JSONB)`,
                        [
                            event.userId || null,
                            event.action,
                            event.resourceType,
                            event.resourceId || null,
                            event.ip || null,
                            event.userAgent || null,
                            JSON.stringify(event.details),
                        ],
                    );
                }

                await client.query('COMMIT');
                logger.debug({ count: events.length }, 'Audit events processed');
            } catch (error: any) {
                await client.query('ROLLBACK');
                logger.error({ error, eventCount: events.length }, 'Failed to process audit events');
                // Re-queue events on error (with limit to prevent infinite loop)
                if (this.auditQueue.length < 10000) {
                    this.auditQueue.unshift(...events);
                }
            } finally {
                client.release();
            }
        } finally {
            this.processingQueue = false;
        }
    }
}

