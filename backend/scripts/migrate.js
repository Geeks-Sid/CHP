const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables (optional, will use process.env if dotenv not available)
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv not installed, use process.env directly
}

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'hospital',
  user: process.env.PGUSER || 'hospital',
  password: process.env.PGPASSWORD || 'password',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../database/migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations directory not found:', migrationsDir);
    process.exit(1);
  }

  // Get all SQL files and sort them
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files`);

  // Create migration tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  // Get already applied migrations
  const { rows: appliedMigrations } = await pool.query(
    'SELECT version FROM schema_migrations'
  );
  const appliedVersions = new Set(appliedMigrations.map((r) => r.version));

  let appliedCount = 0;

  for (const file of files) {
    const version = file.replace('.sql', '');
    
    if (appliedVersions.has(version)) {
      console.log(`✓ ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`Applying ${file}...`);

    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
      await pool.query('COMMIT');
      console.log(`✓ ${file} applied successfully`);
      appliedCount++;
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error(`✗ Failed to apply ${file}:`, error.message);
      throw error;
    }
  }

  console.log(`\nMigration complete. Applied ${appliedCount} new migration(s).`);
}

runMigrations()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    pool.end();
    process.exit(1);
  });

