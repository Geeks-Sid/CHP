import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '../../common/logger/logger.config';
import { Configuration } from '../../config/configuration';

export interface ExternalConcept {
    code: string;
    display: string;
    system: string;
}

export interface ExternalSearchOptions {
    q: string;
    system?: string;
    limit?: number;
}

/**
 * External Terminology Adapter
 * Optional adapter for external terminology services (Ontoserver, Snowstorm)
 * Can be enabled via feature flag
 */
@Injectable()
export class ExternalTerminologyAdapter {
    private readonly enabled: boolean;
    private readonly ontoserverUrl?: string;
    private readonly snowstormUrl?: string;

    constructor(private readonly configService: ConfigService<Configuration>) {
        // Feature flag: enable external terminology adapter
        this.enabled = this.configService.get('EXTERNAL_TERMINOLOGY_ENABLED', { infer: true }) === 'true';
        this.ontoserverUrl = this.configService.get('ONTOSERVER_URL', { infer: true });
        this.snowstormUrl = this.configService.get('SNOWSTORM_URL', { infer: true });

        if (this.enabled) {
            logger.info(
                { ontoserverUrl: this.ontoserverUrl, snowstormUrl: this.snowstormUrl },
                'External terminology adapter enabled',
            );
        }
    }

    /**
     * Check if external adapter is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Search concepts using Ontoserver
     * Ontoserver is a FHIR terminology server
     */
    async searchOntoserver(options: ExternalSearchOptions): Promise<ExternalConcept[]> {
        if (!this.ontoserverUrl) {
            throw new Error('Ontoserver URL not configured');
        }

        try {
            // FHIR CodeSystem $lookup or $validate-code operation
            // This is a simplified example - adjust based on your Ontoserver setup
            const url = new URL(`${this.ontoserverUrl}/fhir/CodeSystem/$lookup`);
            url.searchParams.set('code', options.q);
            if (options.system) {
                url.searchParams.set('system', options.system);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/fhir+json',
                },
            });

            if (!response.ok) {
                throw new Error(`Ontoserver request failed: ${response.statusText}`);
            }

            const data = await response.json();
            // Parse FHIR response and convert to ExternalConcept format
            // This is a simplified example - adjust based on actual FHIR response structure
            return this.parseFhirResponse(data);
        } catch (error: any) {
            logger.error({ error, options }, 'Failed to search Ontoserver');
            throw error;
        }
    }

    /**
     * Search concepts using Snowstorm (SNOMED CT terminology server)
     */
    async searchSnowstorm(options: ExternalSearchOptions): Promise<ExternalConcept[]> {
        if (!this.snowstormUrl) {
            throw new Error('Snowstorm URL not configured');
        }

        try {
            // Snowstorm ECL (Expression Constraint Language) search
            const url = new URL(`${this.snowstormUrl}/browser/MAIN/concepts`);
            url.searchParams.set('term', options.q);
            url.searchParams.set('limit', String(options.limit || 20));

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Snowstorm request failed: ${response.statusText}`);
            }

            const data = await response.json();
            // Parse Snowstorm response and convert to ExternalConcept format
            return this.parseSnowstormResponse(data);
        } catch (error: any) {
            logger.error({ error, options }, 'Failed to search Snowstorm');
            throw error;
        }
    }

    /**
     * Parse FHIR response from Ontoserver
     */
    private parseFhirResponse(data: any): ExternalConcept[] {
        // Simplified parser - adjust based on actual FHIR response structure
        const concepts: ExternalConcept[] = [];

        if (data.parameter) {
            for (const param of data.parameter) {
                if (param.name === 'display' && param.valueString) {
                    concepts.push({
                        code: data.parameter.find((p: any) => p.name === 'code')?.valueCode || '',
                        display: param.valueString,
                        system: data.parameter.find((p: any) => p.name === 'system')?.valueUri || '',
                    });
                }
            }
        }

        return concepts;
    }

    /**
     * Parse Snowstorm response
     */
    private parseSnowstormResponse(data: any): ExternalConcept[] {
        // Simplified parser - adjust based on actual Snowstorm response structure
        const concepts: ExternalConcept[] = [];

        if (data.items) {
            for (const item of data.items) {
                concepts.push({
                    code: item.conceptId || item.id || '',
                    display: item.fsn?.term || item.pt?.term || '',
                    system: 'http://snomed.info/sct',
                });
            }
        }

        return concepts;
    }
}

