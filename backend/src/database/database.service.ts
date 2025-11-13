import { Inject, Injectable } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { logger } from '../common/logger/logger.config';

@Injectable()
export class DatabaseService {
    constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) { }

    async query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            logger.debug({ duration, query: text.substring(0, 100) }, 'Database query executed');
            return { rows: result.rows, rowCount: result.rowCount || 0 };
        } catch (error) {
            logger.error({ error, query: text }, 'Database query failed');
            throw error;
        }
    }

    async getClient(): Promise<PoolClient> {
        return this.pool.connect();
    }

    async withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await fn(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error({ error }, 'Transaction rolled back');
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

