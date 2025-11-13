import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { FastifyRequest } from 'fastify';

/**
 * Correlation Service
 * Manages request/DB correlation using trace IDs
 * Propagates trace IDs to SQL comments for pg_stat_activity visibility
 */
@Injectable()
export class CorrelationService {
    private readonly asyncLocalStorage = new AsyncLocalStorage<{
        requestId: string;
        traceId: string;
        userId?: string;
    }>();

    /**
     * Run a function with correlation context
     */
    runWithContext<T>(context: { requestId: string; traceId: string; userId?: string }, fn: () => T): T {
        return this.asyncLocalStorage.run(context, fn);
    }

    /**
     * Get current correlation context
     */
    getContext(): { requestId: string; traceId: string; userId?: string } | undefined {
        return this.asyncLocalStorage.getStore();
    }

    /**
     * Get current request ID
     */
    getRequestId(): string | undefined {
        const context = this.getContext();
        return context?.requestId;
    }

    /**
     * Get current trace ID (same as request ID for now, can be extended for distributed tracing)
     */
    getTraceId(): string | undefined {
        const context = this.getContext();
        return context?.traceId || context?.requestId;
    }

    /**
     * Get current user ID
     */
    getUserId(): string | undefined {
        const context = this.getContext();
        return context?.userId;
    }

    /**
     * Extract correlation context from Fastify request
     */
    extractFromRequest(request: FastifyRequest): {
        requestId: string;
        traceId: string;
        userId?: string;
    } {
        const requestId = (request.headers['x-request-id'] as string) || 
                         (request as any).id || 
                         this.generateId();
        
        // Use X-Trace-ID header if present (for distributed tracing), otherwise use request ID
        const traceId = (request.headers['x-trace-id'] as string) || requestId;
        
        // Extract user ID from request (set by JwtAuthGuard)
        const userId = (request as any).user?.userId;

        return {
            requestId,
            traceId,
            userId,
        };
    }

    /**
     * Generate SQL comment with trace ID for correlation
     * This makes queries visible in pg_stat_activity with trace context
     */
    addTraceComment(sql: string): string {
        const traceId = this.getTraceId();
        const requestId = this.getRequestId();
        const userId = this.getUserId();

        if (!traceId) {
            return sql;
        }

        // Build comment with correlation data
        const commentParts: string[] = [`trace_id:${traceId}`];
        if (requestId && requestId !== traceId) {
            commentParts.push(`request_id:${requestId}`);
        }
        if (userId) {
            commentParts.push(`user_id:${userId}`);
        }

        const comment = `/* ${commentParts.join(' ')} */`;

        // Add comment at the end of the SQL statement
        // PostgreSQL supports comments after semicolons or at the end
        return `${sql.trim()} ${comment}`;
    }

    /**
     * Generate a unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}

