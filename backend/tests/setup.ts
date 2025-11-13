import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

let postgresContainer: StartedTestContainer;
let testPool: Pool;

/**
 * Setup test database using Testcontainers
 * This runs before all tests
 */
export async function setupTestDatabase(): Promise<Pool> {
  if (testPool) {
    return testPool;
  }

  // Start PostgreSQL container
  postgresContainer = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'hospital_test',
      POSTGRES_USER: 'hospital_test',
      POSTGRES_PASSWORD: 'test_password',
    })
    .withExposedPorts(5432)
    .start();

  const host = postgresContainer.getHost();
  const port = postgresContainer.getMappedPort(5432);

  // Create connection pool
  testPool = new Pool({
    host,
    port,
    database: 'hospital_test',
    user: 'hospital_test',
    password: 'test_password',
    max: 10,
  });

  // Apply migrations
  await applyMigrations(testPool);

  // Set environment variables for tests
  process.env.PGHOST = host;
  process.env.PGPORT = String(port);
  process.env.PGDATABASE = 'hospital_test';
  process.env.PGUSER = 'hospital_test';
  process.env.PGPASSWORD = 'test_password';
  process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
  process.env.JWT_ACCESS_TTL = '900';
  process.env.JWT_REFRESH_TTL = '604800';
  process.env.JWT_ISSUER = 'hospital-ms-test';

  return testPool;
}

/**
 * Apply database migrations
 */
async function applyMigrations(pool: Pool): Promise<void> {
  const migrationsDir = path.join(__dirname, '../../database/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.warn('Migrations directory not found, skipping migrations');
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
  }
}

/**
 * Cleanup test database
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null as any;
  }

  if (postgresContainer) {
    await postgresContainer.stop();
    postgresContainer = null as any;
  }
}

/**
 * Get test database pool
 */
export function getTestPool(): Pool {
  if (!testPool) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return testPool;
}

// Note: Global setup/teardown should be configured in jest.config.ts
// using setupFilesAfterEnv, or use separate setup/teardown files
// For now, tests should call setupTestDatabase() and teardownTestDatabase() explicitly

