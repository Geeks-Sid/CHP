import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { logger } from '../common/logger/logger.config';

@Injectable()
export class HealthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async checkLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness(): Promise<{
    status: string;
    database: string;
    migrations: string;
    timestamp: string;
  }> {
    const dbHealthy = await this.databaseService.healthCheck();
    const migrationsStatus = await this.checkMigrationsStatus();

    return {
      status: dbHealthy && migrationsStatus.migrated ? 'ready' : 'not ready',
      database: dbHealthy ? 'connected' : 'disconnected',
      migrations: migrationsStatus.migrated ? 'up to date' : 'pending',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Check if database migrations are up to date
   * This checks if the expected migration files have been applied
   */
  private async checkMigrationsStatus(): Promise<{ migrated: boolean; version?: string }> {
    try {
      // Check if schema_version table exists (Flyway-style)
      const schemaCheck = await this.databaseService.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'schema_version'
        )`,
      );

      if (!schemaCheck.rows[0]?.exists) {
        // If schema_version doesn't exist, check for key tables
        const tablesCheck = await this.databaseService.query(
          `SELECT COUNT(*) as count
           FROM information_schema.tables
           WHERE table_schema = 'public'
           AND table_name IN ('users', 'roles', 'person', 'visit_occurrence')`,
        );

        const tableCount = parseInt(tablesCheck.rows[0]?.count || '0', 10);
        return {
          migrated: tableCount >= 4, // At least core tables exist
        };
      }

      // Get latest migration version
      const versionCheck = await this.databaseService.query(
        `SELECT version, installed_on 
         FROM schema_version 
         ORDER BY installed_rank DESC 
         LIMIT 1`,
      );

      if (versionCheck.rows.length === 0) {
        return { migrated: false };
      }

      // Check if expected migrations are applied
      // This is a simplified check - in production, compare against expected version
      const expectedMigrations = [
        'V000',
        'V001',
        'V002',
        'V003',
        'V004',
        'V005',
        'V006',
        'V007',
        'V008',
        'V009',
        'V010',
        'V011',
        'V012',
      ];

      const latestVersion = versionCheck.rows[0].version;
      const latestVersionNum = parseInt(latestVersion.replace('V', '').replace('__.*', ''), 10);
      const expectedLatest = parseInt(
        expectedMigrations[expectedMigrations.length - 1].replace('V', '').replace('__.*', ''),
        10,
      );

      return {
        migrated: latestVersionNum >= expectedLatest,
        version: latestVersion,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to check migration status');
      return { migrated: false };
    }
  }
}

