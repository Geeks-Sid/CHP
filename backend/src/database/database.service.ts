import { Inject, Injectable, Optional } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';
import { CorrelationService } from '../telemetry/services/correlation.service';

@Injectable()
export class DatabaseService {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        @Optional() private readonly correlationService?: CorrelationService,
    ) { }

    async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
        const start = Date.now();

        // Add trace ID comment to SQL for correlation
        const sqlWithTrace = this.correlationService
            ? this.correlationService.addTraceComment(text)
            : text;

        try {
            const result = await this.pool.query(sqlWithTrace, params);
            const duration = Date.now() - start;

            const traceId = this.correlationService?.getTraceId();
            logger.debug(
                { duration, query: text.substring(0, 100), traceId },
                'Database query executed',
            );

            return { rows: result.rows, rowCount: result.rowCount || 0 };
        } catch (error) {
            const traceId = this.correlationService?.getTraceId();
            logger.error({ error, query: text, traceId }, 'Database query failed');
            throw error;
        }
    }

    async getClient(): Promise<PoolClient> {
        return this.pool.connect();
    }

    /**
     * Add trace comment to SQL query
     * Use this helper when executing queries directly with a PoolClient
     */
    addTraceComment(sql: string): string {
        if (this.correlationService) {
            return this.correlationService.addTraceComment(sql);
        }
        return sql;
    }

    async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        const traceId = this.correlationService?.getTraceId();

        try {
            // Add trace comment to BEGIN
            const beginSql = this.correlationService
                ? this.correlationService.addTraceComment('BEGIN')
                : 'BEGIN';
            await client.query(beginSql);

            const result = await fn(client);

            // Add trace comment to COMMIT
            const commitSql = this.correlationService
                ? this.correlationService.addTraceComment('COMMIT')
                : 'COMMIT';
            await client.query(commitSql);

            return result;
        } catch (error) {
            // Add trace comment to ROLLBACK
            const rollbackSql = this.correlationService
                ? this.correlationService.addTraceComment('ROLLBACK')
                : 'ROLLBACK';
            await client.query(rollbackSql);

            logger.error({ error, traceId }, 'Transaction rolled back');
            throw error;
        } finally {
            client.release();
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const result = await this.pool.query('SELECT 1');
            return result.rows.length > 0;
        } catch (error) {
            logger.error({ error }, 'Database health check failed');
            return false;
        }
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

