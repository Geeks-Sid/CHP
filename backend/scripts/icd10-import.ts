import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} catch (e) {
  // dotenv not installed, use process.env directly
}

interface ICD10Row {
  CODE: string;
  'SHORT DESCRIPTION (VALID ICD-10 FY2025)': string;
  'LONG DESCRIPTION (VALID ICD-10 FY2025)': string;
}

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'hospital',
  user: process.env.PGUSER || 'hospital',
  password: process.env.PGPASSWORD || 'password',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

const VOCABULARY_ID = 'ICD10CM';
const DOMAIN_ID = 'Condition';
const CONCEPT_CLASS_ID = 'ICD10CM';

/**
 * Ensure ICD10CM vocabulary exists in the vocabulary table
 */
async function ensureVocabulary(): Promise<void> {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM vocabulary WHERE vocabulary_id = $1`,
    [VOCABULARY_ID]
  );

  if (rowCount === 0) {
    await pool.query(
      `INSERT INTO vocabulary (vocabulary_id, vocabulary_name) 
       VALUES ($1, $2) 
       ON CONFLICT (vocabulary_id) DO NOTHING`,
      [VOCABULARY_ID, 'ICD10CM - International Classification of Diseases, 10th Revision, Clinical Modification']
    );
    console.log(`✓ Created vocabulary: ${VOCABULARY_ID}`);
  } else {
    console.log(`✓ Vocabulary ${VOCABULARY_ID} already exists`);
  }
}

/**
 * Get the next concept_id to use
 * Uses a range starting from 1000000 for ICD-10 codes to avoid conflicts
 */
async function getNextConceptId(startFrom: number = 1000000): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(concept_id), 0) as max_id FROM concept`
  );
  const maxId = parseInt(rows[0].max_id, 10);
  
  // Use the higher of: max_id + 1, or startFrom
  return Math.max(maxId + 1, startFrom);
}

/**
 * Parse Excel file and extract ICD-10 codes
 */
function parseExcelFile(filePath: string): ICD10Row[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  console.log(`Reading Excel file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  
  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json<ICD10Row>(worksheet);
  
  console.log(`Found ${data.length} rows in Excel file`);
  return data;
}

/**
 * Import ICD-10 codes into the concept table
 */
async function importICD10Codes(filePath: string): Promise<void> {
  console.log('Starting ICD-10 import...\n');

  // Ensure vocabulary exists
  await ensureVocabulary();

  // Parse Excel file
  const rows = parseExcelFile(filePath);

  if (rows.length === 0) {
    console.log('No data found in Excel file');
    return;
  }

  // Get starting concept_id
  let currentConceptId = await getNextConceptId(1000000);
  console.log(`Starting with concept_id: ${currentConceptId}\n`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches for better performance
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    
    await pool.query('BEGIN');
    
    try {
      for (const row of batch) {
        const code = row.CODE?.trim();
        const shortDesc = row['SHORT DESCRIPTION (VALID ICD-10 FY2025)']?.trim() || '';
        const longDesc = row['LONG DESCRIPTION (VALID ICD-10 FY2025)']?.trim() || '';

        // Skip rows without code
        if (!code) {
          skipped++;
          continue;
        }

        // Use long description if available, otherwise short description
        const conceptName = longDesc || shortDesc || code;

        if (!conceptName) {
          skipped++;
          continue;
        }

        try {
          // Check if concept with this code already exists
          const { rows: existing } = await pool.query(
            `SELECT concept_id FROM concept 
             WHERE concept_code = $1 AND vocabulary_id = $2`,
            [code, VOCABULARY_ID]
          );

          if (existing.length > 0) {
            // Update existing concept
            await pool.query(
              `UPDATE concept 
               SET concept_name = $1, domain_id = $2, concept_class_id = $3
               WHERE concept_id = $4`,
              [conceptName, DOMAIN_ID, CONCEPT_CLASS_ID, existing[0].concept_id]
            );
            updated++;
          } else {
            // Insert new concept
            await pool.query(
              `INSERT INTO concept 
               (concept_id, concept_name, vocabulary_id, concept_code, domain_id, concept_class_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [currentConceptId, conceptName, VOCABULARY_ID, code, DOMAIN_ID, CONCEPT_CLASS_ID]
            );
            inserted++;
            currentConceptId++;
          }
        } catch (error: any) {
          console.error(`Error processing code ${code}:`, error.message);
          errors++;
        }
      }

      await pool.query('COMMIT');
      
      // Progress indicator
      if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= rows.length) {
        const processed = Math.min(i + BATCH_SIZE, rows.length);
        console.log(`Processed ${processed}/${rows.length} rows...`);
      }
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`✓ Inserted: ${inserted} codes`);
  console.log(`✓ Updated: ${updated} codes`);
  console.log(`⚠ Skipped: ${skipped} rows (missing code or description)`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors} rows`);
  }
  console.log(`\nTotal processed: ${rows.length} rows`);
}

/**
 * Main function
 */
async function main() {
  // Get file path from command line argument or use default
  const args = process.argv.slice(2);
  let filePath: string;

  if (args.includes('--file') || args.includes('-f')) {
    const fileIndex = args.indexOf('--file') !== -1 
      ? args.indexOf('--file') 
      : args.indexOf('-f');
    filePath = args[fileIndex + 1];
    
    if (!filePath) {
      console.error('Error: --file requires a file path');
      process.exit(1);
    }
    
    // If relative path, resolve from project root
    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, '../../', filePath);
    }
  } else {
    // Default: look for Excel files in Data folder
    const dataDir = path.join(__dirname, '../../Data');
    
    if (!fs.existsSync(dataDir)) {
      console.error(`Error: Data directory not found: ${dataDir}`);
      console.error('Please create the Data folder and place your ICD-10 Excel file there,');
      console.error('or provide a file with --file option');
      process.exit(1);
    }
    
    const files = fs.readdirSync(dataDir).filter(f => 
      f.endsWith('.xlsx') || f.endsWith('.xls')
    );
    
    if (files.length === 0) {
      console.error(`Error: No Excel files found in ${dataDir}`);
      console.error('Please provide a file with --file option or place an Excel file in the Data folder');
      process.exit(1);
    }
    
    if (files.length > 1) {
      console.error(`Error: Multiple Excel files found in ${dataDir}:`);
      files.forEach(f => console.error(`  - ${f}`));
      console.error('Please specify which file to use with --file option');
      process.exit(1);
    }
    
    filePath = path.join(dataDir, files[0]);
  }

  try {
    await importICD10Codes(filePath);
    console.log('\n✓ Import completed successfully!');
  } catch (error: any) {
    console.error('\n✗ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

