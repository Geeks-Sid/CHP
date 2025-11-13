import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logger } from '../../common/logger/logger.config';
import { Configuration } from '../../config/configuration';

/**
 * Secrets Service
 * Manages runtime secrets from Vault/Secrets Manager
 * Never logs secrets
 * Supports key rotation
 */
@Injectable()
export class SecretsService implements OnModuleInit {
    private secrets: Map<string, string> = new Map();
    private readonly useVault: boolean;
    private readonly vaultUrl?: string;
    private readonly vaultToken?: string;

    constructor(private readonly configService: ConfigService<Configuration>) {
        this.useVault = this.configService.get('VAULT_ENABLED', { infer: true }) === 'true';
        this.vaultUrl = this.configService.get('VAULT_URL', { infer: true });
        this.vaultToken = this.configService.get('VAULT_TOKEN', { infer: true });
    }

    async onModuleInit() {
        if (this.useVault) {
            await this.loadSecretsFromVault();
        } else {
            // Fallback to environment variables
            this.loadSecretsFromEnv();
        }
    }

    /**
     * Get secret by key
     * Returns undefined if secret not found (never throws to avoid information leakage)
     */
    getSecret(key: string): string | undefined {
        return this.secrets.get(key);
    }

    /**
     * Get secret or throw if not found
     * Use only when secret is required
     */
    getRequiredSecret(key: string): string {
        const secret = this.secrets.get(key);
        if (!secret) {
            throw new Error(`Required secret '${key}' not found`);
        }
        return secret;
    }

    /**
     * Rotate secret
     * Fetches new secret from Vault and updates cache
     */
    async rotateSecret(key: string): Promise<void> {
        if (this.useVault) {
            await this.loadSecretFromVault(key);
            logger.info({ key }, 'Secret rotated');
        } else {
            // In non-Vault mode, reload from environment
            const envKey = this.getEnvKey(key);
            const value = process.env[envKey];
            if (value) {
                this.secrets.set(key, value);
                logger.info({ key }, 'Secret reloaded from environment');
            }
        }
    }

    /**
     * Load secrets from HashiCorp Vault
     */
    private async loadSecretsFromVault(): Promise<void> {
        if (!this.vaultUrl || !this.vaultToken) {
            logger.warn('Vault enabled but URL or token not configured');
            return;
        }

        try {
            logger.info({ vaultUrl: this.vaultUrl }, 'Loading secrets from Vault');

            // Example: Load secrets from Vault KV v2
            // Adjust based on your Vault setup
            const secretsToLoad = [
                'jwt_secret',
                'database_password',
                's3_secret_key',
                'api_keys',
            ];

            for (const secretKey of secretsToLoad) {
                await this.loadSecretFromVault(secretKey);
            }

            logger.info({ count: this.secrets.size }, 'Secrets loaded from Vault');
        } catch (error: any) {
            logger.error({ error }, 'Failed to load secrets from Vault');
            // Fallback to environment variables
            this.loadSecretsFromEnv();
        }
    }

    /**
     * Load a specific secret from Vault
     */
    private async loadSecretFromVault(key: string): Promise<void> {
        try {
            // Example Vault API call (adjust based on your Vault setup)
            // This is a simplified example - implement based on your Vault configuration
            const vaultPath = `secret/data/${key}`;
            const response = await fetch(`${this.vaultUrl}/v1/${vaultPath}`, {
                method: 'GET',
                headers: {
                    'X-Vault-Token': this.vaultToken!,
                },
            });

            if (!response.ok) {
                logger.warn({ key, status: response.status }, 'Failed to load secret from Vault');
                return;
            }

            const data = await response.json();
            const secretValue = data.data?.data?.value || data.data?.value;

            if (secretValue) {
                this.secrets.set(key, secretValue);
            }
        } catch (error: any) {
            logger.error({ error, key }, 'Error loading secret from Vault');
        }
    }

    /**
     * Load secrets from environment variables
     */
    private loadSecretsFromEnv(): void {
        logger.info('Loading secrets from environment variables');

        // Map secret keys to environment variable names
        const secretMap: Record<string, string> = {
            jwt_secret: 'JWT_SECRET',
            database_password: 'PGPASSWORD',
            s3_secret_key: 'S3_SECRET_KEY',
        };

        for (const [key, envKey] of Object.entries(secretMap)) {
            const value = process.env[envKey];
            if (value) {
                this.secrets.set(key, value);
            }
        }

        logger.info({ count: this.secrets.size }, 'Secrets loaded from environment');
    }

    /**
     * Get environment variable key for a secret
     */
    private getEnvKey(secretKey: string): string {
        const mapping: Record<string, string> = {
            jwt_secret: 'JWT_SECRET',
            database_password: 'PGPASSWORD',
            s3_secret_key: 'S3_SECRET_KEY',
        };
        return mapping[secretKey] || secretKey.toUpperCase();
    }

    /**
     * Check if secret exists
     */
    hasSecret(key: string): boolean {
        return this.secrets.has(key);
    }

    /**
     * List all secret keys (without values)
     */
    listSecretKeys(): string[] {
        return Array.from(this.secrets.keys());
    }
}

