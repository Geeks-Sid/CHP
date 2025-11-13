import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '../common/logger/logger.config';
import { Configuration } from '../config/configuration';

/**
 * Feature Flags Service
 * Manages feature toggles via environment variables
 * Supports runtime feature flag checks
 */
@Injectable()
export class FeatureFlagsService {
    private readonly flags: Map<string, boolean> = new Map();

    constructor(private readonly configService: ConfigService<Configuration>) {
        this.loadFeatureFlags();
    }

    /**
     * Load feature flags from environment variables
     */
    private loadFeatureFlags(): void {
        // FHIR write endpoints
        this.flags.set(
            'fhir.write.enabled',
            this.configService.get('FHIR_WRITE_ENABLED', { infer: true }) === 'true',
        );

        // External terminology adapter
        this.flags.set(
            'terminology.external.enabled',
            this.configService.get('EXTERNAL_TERMINOLOGY_ENABLED', { infer: true }) === 'true',
        );

        // Multi-tenant support (future)
        this.flags.set(
            'multi_tenant.enabled',
            this.configService.get('MULTI_TENANT_ENABLED', { infer: true }) === 'true',
        );

        // Audit logging (can be disabled for performance)
        this.flags.set(
            'audit.enabled',
            this.configService.get('AUDIT_ENABLED', { infer: true }) !== 'false', // Default: enabled
        );

        // Document upload (can be disabled for maintenance)
        this.flags.set(
            'documents.upload.enabled',
            this.configService.get('DOCUMENTS_UPLOAD_ENABLED', { infer: true }) !== 'false', // Default: enabled
        );

        // Reports (can be disabled)
        this.flags.set(
            'reports.enabled',
            this.configService.get('REPORTS_ENABLED', { infer: true }) !== 'false', // Default: enabled
        );

        logger.info(
            { flags: Array.from(this.flags.entries()) },
            'Feature flags loaded',
        );
    }

    /**
     * Check if a feature is enabled
     */
    isEnabled(flag: string): boolean {
        return this.flags.get(flag) === true;
    }

    /**
     * Check if a feature is disabled
     */
    isDisabled(flag: string): boolean {
        return !this.isEnabled(flag);
    }

    /**
     * Get all feature flags
     */
    getAllFlags(): Record<string, boolean> {
        const result: Record<string, boolean> = {};
        for (const [key, value] of this.flags.entries()) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Reload feature flags (useful for runtime updates)
     */
    reload(): void {
        this.flags.clear();
        this.loadFeatureFlags();
        logger.info('Feature flags reloaded');
    }

    /**
     * Set a feature flag (for testing or runtime updates)
     * Note: This only updates in-memory, not environment variables
     */
    setFlag(flag: string, enabled: boolean): void {
        this.flags.set(flag, enabled);
        logger.info({ flag, enabled }, 'Feature flag updated');
    }
}

