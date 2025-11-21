#!/usr/bin/env ts-node
/**
 * Health Check Script
 * 
 * Checks the existence and connectivity of all required databases and services
 * before the server starts. This ensures all dependencies are available.
 * 
 * Usage: npm run healthcheck
 */

import { Pool } from 'pg';
import * as process from 'process';
import { configuration } from '../src/config/configuration';

// Optional AWS SDK import
let S3Client: any = null;
let HeadBucketCommand: any = null;
let ListBucketsCommand: any = null;
try {
    const s3 = require('@aws-sdk/client-s3');
    S3Client = s3.S3Client;
    HeadBucketCommand = s3.HeadBucketCommand;
    ListBucketsCommand = s3.ListBucketsCommand;
} catch (e) {
    // AWS SDK package not installed, will skip S3 checks
}

// Optional Redis import
let redisClient: any = null;
try {
    const redis = require('redis');
    redisClient = redis.createClient;
} catch (e) {
    // Redis package not installed, will skip Redis checks
}

interface HealthCheckResult {
    service: string;
    status: 'ok' | 'error' | 'warning' | 'skipped';
    message: string;
    details?: any;
}

const results: HealthCheckResult[] = [];
let hasErrors = false;
let hasWarnings = false;

// Required database tables (core tables that must exist)
const REQUIRED_TABLES = [
    'users',
    'roles',
    'permissions',
    'role_permissions',
    'person',
    'visit_occurrence',
    'procedure_occurrence',
    'drug_exposure',
    'document',
    'concept',
    'vocabulary',
    'audit_log',
];

// Optional tables (nice to have but not critical)
const OPTIONAL_TABLES = [
    'condition_occurrence',
    'inventory_item',
    'prescription',
];

function addResult(result: HealthCheckResult) {
    results.push(result);
    if (result.status === 'error') {
        hasErrors = true;
    } else if (result.status === 'warning') {
        hasWarnings = true;
    }
}

function printResult(result: HealthCheckResult) {
    const statusIcon = {
        ok: '✅',
        error: '❌',
        warning: '⚠️',
        skipped: '⏭️',
    }[result.status];

    console.log(`${statusIcon} ${result.service}: ${result.message}`);
    if (result.details) {
        console.log(`   ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
    }
}

/**
 * Check PostgreSQL database connection and required tables
 */
async function checkPostgreSQL(): Promise<void> {
    const config = configuration();
    const pool = new Pool({
        host: config.PGHOST,
        port: config.PGPORT,
        database: config.PGDATABASE,
        user: config.PGUSER,
        password: config.PGPASSWORD,
        ssl: config.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
        connectionTimeoutMillis: 5000,
    });

    try {
        // Test connection
        const connectionTest = await pool.query('SELECT version()');
        if (connectionTest.rows.length === 0) {
            addResult({
                service: 'PostgreSQL Connection',
                status: 'error',
                message: 'Failed to connect to database',
            });
            return;
        }

        const version = connectionTest.rows[0].version;
        addResult({
            service: 'PostgreSQL Connection',
            status: 'ok',
            message: `Connected to ${config.PGDATABASE}@${config.PGHOST}:${config.PGPORT}`,
            details: { version: version.split(' ')[0] + ' ' + version.split(' ')[1] },
        });

        // Check if database exists
        const dbCheck = await pool.query(
            `SELECT datname FROM pg_database WHERE datname = $1`,
            [config.PGDATABASE]
        );

        if (dbCheck.rows.length === 0) {
            addResult({
                service: 'PostgreSQL Database',
                status: 'error',
                message: `Database '${config.PGDATABASE}' does not exist`,
            });
            await pool.end();
            return;
        }

        addResult({
            service: 'PostgreSQL Database',
            status: 'ok',
            message: `Database '${config.PGDATABASE}' exists`,
        });

        // Check required tables
        const missingTables: string[] = [];
        const existingTables: string[] = [];

        for (const table of REQUIRED_TABLES) {
            const tableCheck = await pool.query(
                `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
                [table]
            );

            if (tableCheck.rows[0]?.exists) {
                existingTables.push(table);
            } else {
                missingTables.push(table);
            }
        }

        if (missingTables.length > 0) {
            addResult({
                service: 'PostgreSQL Required Tables',
                status: 'error',
                message: `Missing ${missingTables.length} required table(s)`,
                details: { missing: missingTables, existing: existingTables },
            });
        } else {
            addResult({
                service: 'PostgreSQL Required Tables',
                status: 'ok',
                message: `All ${REQUIRED_TABLES.length} required tables exist`,
                details: { tables: existingTables },
            });
        }

        // Check optional tables
        const missingOptional: string[] = [];
        for (const table of OPTIONAL_TABLES) {
            const tableCheck = await pool.query(
                `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
                [table]
            );

            if (!tableCheck.rows[0]?.exists) {
                missingOptional.push(table);
            }
        }

        if (missingOptional.length > 0) {
            addResult({
                service: 'PostgreSQL Optional Tables',
                status: 'warning',
                message: `${missingOptional.length} optional table(s) not found`,
                details: { missing: missingOptional },
            });
        }

        // Check database extensions
        const extensions = await pool.query(
            `SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto', 'uuid-ossp', 'pg_trgm')`
        );
        const foundExtensions = extensions.rows.map((r) => r.extname);
        const requiredExtensions = ['pgcrypto', 'uuid-ossp', 'pg_trgm'];
        const missingExtensions = requiredExtensions.filter((ext) => !foundExtensions.includes(ext));

        if (missingExtensions.length > 0) {
            addResult({
                service: 'PostgreSQL Extensions',
                status: 'warning',
                message: `Missing ${missingExtensions.length} extension(s)`,
                details: { missing: missingExtensions, found: foundExtensions },
            });
        } else {
            addResult({
                service: 'PostgreSQL Extensions',
                status: 'ok',
                message: 'All required extensions are installed',
                details: { extensions: foundExtensions },
            });
        }

    } catch (error: any) {
        addResult({
            service: 'PostgreSQL',
            status: 'error',
            message: `Connection failed: ${error.message}`,
            details: { error: error.code || 'UNKNOWN' },
        });
    } finally {
        await pool.end();
    }
}

/**
 * Check MinIO/S3 connection and bucket
 */
async function checkS3(): Promise<void> {
    const config = configuration();

    if (!S3Client) {
        addResult({
            service: 'S3/MinIO',
            status: 'skipped',
            message: 'AWS SDK package not installed (optional dependency)',
        });
        return;
    }

    try {
        const isMinIO = config.S3_ENDPOINT && !config.S3_ENDPOINT.includes('amazonaws.com');

        const s3Client = new S3Client({
            endpoint: config.S3_ENDPOINT,
            region: config.S3_REGION,
            credentials: {
                accessKeyId: config.S3_ACCESS_KEY,
                secretAccessKey: config.S3_SECRET_KEY,
            },
            forcePathStyle: isMinIO,
        });

        // Test connection by listing buckets
        try {
            const listCommand = new ListBucketsCommand({});
            const response = await Promise.race([
                s3Client.send(listCommand),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), 5000)
                ),
            ]) as any;

            addResult({
                service: 'S3/MinIO Connection',
                status: 'ok',
                message: `Connected to ${isMinIO ? 'MinIO' : 'S3'} at ${config.S3_ENDPOINT}`,
            });
        } catch (error: any) {
            addResult({
                service: 'S3/MinIO Connection',
                status: 'error',
                message: `Failed to connect: ${error.message}`,
            });
            return;
        }

        // Check if bucket exists
        try {
            const headCommand = new HeadBucketCommand({ Bucket: config.S3_BUCKET });
            await Promise.race([
                s3Client.send(headCommand),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Bucket check timeout')), 5000)
                ),
            ]);

            addResult({
                service: 'S3/MinIO Bucket',
                status: 'ok',
                message: `Bucket '${config.S3_BUCKET}' exists and is accessible`,
            });
        } catch (error: any) {
            if (error.name === 'NotFound' || error.message?.includes('404')) {
                addResult({
                    service: 'S3/MinIO Bucket',
                    status: 'error',
                    message: `Bucket '${config.S3_BUCKET}' does not exist`,
                    details: {
                        hint: 'Create the bucket using: mc mb minio/documents or via MinIO console'
                    },
                });
            } else {
                addResult({
                    service: 'S3/MinIO Bucket',
                    status: 'error',
                    message: `Failed to access bucket: ${error.message}`,
                });
            }
        }
    } catch (error: any) {
        addResult({
            service: 'S3/MinIO',
            status: 'error',
            message: `Configuration error: ${error.message}`,
        });
    }
}

/**
 * Check Redis connection (if configured)
 */
async function checkRedis(): Promise<void> {
    const config = configuration();

    if (!config.REDIS_HOST) {
        addResult({
            service: 'Redis',
            status: 'skipped',
            message: 'Redis is not configured (REDIS_HOST not set)',
        });
        return;
    }

    if (!redisClient) {
        addResult({
            service: 'Redis',
            status: 'skipped',
            message: 'Redis package not installed (optional dependency)',
        });
        return;
    }

    try {
        const client = redisClient({
            socket: {
                host: config.REDIS_HOST,
                port: config.REDIS_PORT || 6379,
                connectTimeout: 5000,
            },
            password: config.REDIS_PASSWORD,
        });

        await Promise.race([
            client.connect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            ),
        ]);

        const pong = await client.ping();
        if (pong === 'PONG') {
            addResult({
                service: 'Redis Connection',
                status: 'ok',
                message: `Connected to Redis at ${config.REDIS_HOST}:${config.REDIS_PORT || 6379}`,
            });
        } else {
            addResult({
                service: 'Redis Connection',
                status: 'error',
                message: 'Redis ping failed',
            });
        }

        await client.quit();
    } catch (error: any) {
        addResult({
            service: 'Redis Connection',
            status: 'error',
            message: `Failed to connect: ${error.message}`,
        });
    }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables(): void {
    const config = configuration();
    const issues: string[] = [];

    // Check critical environment variables
    if (config.JWT_SECRET === 'replace-me-with-secure-secret-key-min-32-chars') {
        issues.push('JWT_SECRET is using default value (security risk)');
    }

    if (config.JWT_SECRET.length < 32) {
        issues.push(`JWT_SECRET is too short (${config.JWT_SECRET.length} chars, minimum 32)`);
    }

    if (issues.length > 0) {
        addResult({
            service: 'Environment Variables',
            status: 'warning',
            message: `${issues.length} configuration issue(s) found`,
            details: { issues },
        });
    } else {
        addResult({
            service: 'Environment Variables',
            status: 'ok',
            message: 'Critical environment variables are properly configured',
        });
    }
}

/**
 * Main health check function
 */
async function runHealthCheck(): Promise<void> {
    console.log('\n🔍 Running Health Check...\n');
    console.log('='.repeat(60));

    try {
        // Run all checks
        await checkPostgreSQL();
        await checkS3();
        await checkRedis();
        checkEnvironmentVariables();

        // Print all results
        console.log('\n📊 Health Check Results:\n');
        results.forEach(printResult);

        // Summary
        console.log('\n' + '='.repeat(60));
        const okCount = results.filter((r) => r.status === 'ok').length;
        const errorCount = results.filter((r) => r.status === 'error').length;
        const warningCount = results.filter((r) => r.status === 'warning').length;
        const skippedCount = results.filter((r) => r.status === 'skipped').length;

        console.log(`\n📈 Summary:`);
        console.log(`   ✅ Passed: ${okCount}`);
        console.log(`   ❌ Failed: ${errorCount}`);
        console.log(`   ⚠️  Warnings: ${warningCount}`);
        console.log(`   ⏭️  Skipped: ${skippedCount}`);

        if (hasErrors) {
            console.log('\n❌ Health check FAILED. Please fix the errors above before starting the server.\n');
            process.exit(1);
        } else if (hasWarnings) {
            console.log('\n⚠️  Health check completed with warnings. Server can start, but some features may not work.\n');
            process.exit(0);
        } else {
            console.log('\n✅ All health checks passed! Server is ready to start.\n');
            process.exit(0);
        }
    } catch (error: any) {
        console.error('\n❌ Fatal error during health check:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run health check
runHealthCheck();

