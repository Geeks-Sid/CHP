import { Inject, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { Pool } from 'pg';
import { logger } from '../common/logger/logger.config';
import { DatabaseService } from '../database/database.service';

export interface VocabularyImportOptions {
    vocabularyCsvPath: string;
    conceptCsvPath: string;
    conceptRelationshipCsvPath?: string;
    conceptAncestorCsvPath?: string;
}

/**
 * Vocabulary Import Job
 * Imports vocabulary data from CSV files using PostgreSQL COPY
 * Optimized for large datasets
 */
@Injectable()
export class VocabularyImportJob {
    constructor(
        @Inject('DATABASE_POOL') private readonly pool: Pool,
        private readonly databaseService: DatabaseService,
    ) { }

    /**
     * Import vocabulary from CSV files
     * Uses PostgreSQL COPY for efficient bulk import
     */
    async importVocabulary(options: VocabularyImportOptions): Promise<void> {
        logger.info({ options }, 'Starting vocabulary import');

        try {
            // Import vocabulary table
            if (options.vocabularyCsvPath) {
                await this.importVocabularyTable(options.vocabularyCsvPath);
            }

            // Import concept table
            if (options.conceptCsvPath) {
                await this.importConceptTable(options.conceptCsvPath);
            }

            // Import concept_relationship table (optional)
            if (options.conceptRelationshipCsvPath) {
                await this.importConceptRelationshipTable(options.conceptRelationshipCsvPath);
            }

            // Import concept_ancestor table (optional)
            if (options.conceptAncestorCsvPath) {
                await this.importConceptAncestorTable(options.conceptAncestorCsvPath);
            }

            // Analyze tables and update statistics
            await this.analyzeTables();

            logger.info('Vocabulary import completed successfully');
        } catch (error: any) {
            logger.error({ error, options }, 'Vocabulary import failed');
            throw error;
        }
    }

    /**
     * Import vocabulary table
     */
    private async importVocabularyTable(csvPath: string): Promise<void> {
        logger.info({ csvPath }, 'Importing vocabulary table');

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Truncate table first (optional - remove if you want to append)
            await client.query('TRUNCATE TABLE vocabulary CASCADE');

            // Use COPY for efficient bulk import
            const stream = createReadStream(csvPath);
            const parser = parse({
                columns: true,
                skip_empty_lines: true,
            });

            const copyQuery = `
        COPY vocabulary (vocabulary_id, vocabulary_name)
        FROM STDIN
        WITH (FORMAT csv, HEADER true, DELIMITER ',')
      `;

            // Note: pg COPY FROM STDIN requires special handling
            // For simplicity, we'll use a different approach with INSERT
            // In production, consider using pg-copy-streams or similar library
            await this.importFromCsv(client, csvPath, 'vocabulary', [
                'vocabulary_id',
                'vocabulary_name',
            ]);

            await client.query('COMMIT');
            logger.info('Vocabulary table imported');
        } catch (error: any) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Import concept table
     */
    private async importConceptTable(csvPath: string): Promise<void> {
        logger.info({ csvPath }, 'Importing concept table');

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Truncate table first (optional)
            await client.query('TRUNCATE TABLE concept CASCADE');

            await this.importFromCsv(client, csvPath, 'concept', [
                'concept_id',
                'concept_name',
                'vocabulary_id',
                'concept_code',
                'domain_id',
                'concept_class_id',
            ]);

            await client.query('COMMIT');
            logger.info('Concept table imported');
        } catch (error: any) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Import concept_relationship table
     */
    private async importConceptRelationshipTable(csvPath: string): Promise<void> {
        logger.info({ csvPath }, 'Importing concept_relationship table');

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query('TRUNCATE TABLE concept_relationship');

            await this.importFromCsv(client, csvPath, 'concept_relationship', [
                'concept_id_1',
                'concept_id_2',
                'relationship_id',
            ]);

            await client.query('COMMIT');
            logger.info('Concept relationship table imported');
        } catch (error: any) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Import concept_ancestor table
     */
    private async importConceptAncestorTable(csvPath: string): Promise<void> {
        logger.info({ csvPath }, 'Importing concept_ancestor table');

        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            await client.query('TRUNCATE TABLE concept_ancestor');

            await this.importFromCsv(client, csvPath, 'concept_ancestor', [
                'ancestor_concept_id',
                'descendant_concept_id',
                'min_levels_of_separation',
                'max_levels_of_separation',
            ]);

            await client.query('COMMIT');
            logger.info('Concept ancestor table imported');
        } catch (error: any) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Import from CSV file using INSERT statements
     * For production, consider using pg-copy-streams for better performance
     */
    private async importFromCsv(
        client: any,
        csvPath: string,
        tableName: string,
        columns: string[],
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream = createReadStream(csvPath);
            const parser = parse({
                columns: true,
                skip_empty_lines: true,
            });

            let rowCount = 0;
            const batchSize = 1000;
            let batch: any[] = [];

            parser.on('data', async (row) => {
                batch.push(row);
                rowCount++;

                if (batch.length >= batchSize) {
                    parser.pause();
                    try {
                        await this.insertBatch(client, tableName, columns, batch);
                        batch = [];
                        parser.resume();
                    } catch (error) {
                        parser.destroy();
                        reject(error);
                    }
                }
            });

            parser.on('end', async () => {
                if (batch.length > 0) {
                    try {
                        await this.insertBatch(client, tableName, columns, batch);
                    } catch (error) {
                        reject(error);
                        return;
                    }
                }
                logger.info({ tableName, rowCount }, 'CSV import completed');
                resolve();
            });

            parser.on('error', reject);
            stream.pipe(parser);
        });
    }

    /**
     * Insert batch of rows
     */
    private async insertBatch(
        client: any,
        tableName: string,
        columns: string[],
        rows: any[],
    ): Promise<void> {
        if (rows.length === 0) {
            return;
        }

        const placeholders = rows.map((_, i) => {
            const rowPlaceholders = columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ');
            return `(${rowPlaceholders})`;
        }).join(', ');

        const values = rows.flatMap((row) => columns.map((col) => row[col] || null));

        const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `;

        await client.query(query, values);
    }

    /**
     * Analyze tables and update statistics
     */
    private async analyzeTables(): Promise<void> {
        logger.info('Analyzing tables and updating statistics');

        const tables = ['vocabulary', 'concept', 'concept_relationship', 'concept_ancestor'];

        for (const table of tables) {
            await this.databaseService.query(`ANALYZE ${table}`);
        }

        logger.info('Table analysis completed');
    }
}

