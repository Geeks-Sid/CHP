# ICD-10 Import Script

This script imports ICD-10 codes from Excel files into the `concept` table.

## Prerequisites

1. Ensure PostgreSQL database is running and accessible
2. Database migrations have been run (especially V009__vocabulary_core.sql)
3. Excel file with ICD-10 codes is placed in the `Data` folder

## Excel File Format

The Excel file should have the following columns:
- `CODE` - The ICD-10 code (e.g., A000)
- `SHORT DESCRIPTION (VALID ICD-10 FY2025)` - Short description
- `LONG DESCRIPTION (VALID ICD-10 FY2025)` - Long description

## Usage

### Using npm script (recommended)

```bash
cd backend
npm run icd10:import
```

### With specific file

```bash
cd backend
npm run icd10:import -- --file ../Data/icd10-codes.xlsx
```

### Using npx

```bash
cd backend
npx icd-10 import
npx icd-10 import --file ../Data/icd10-codes.xlsx
```

## What the script does

1. **Ensures vocabulary exists**: Creates ICD10CM vocabulary if it doesn't exist
2. **Reads Excel file**: Parses the Excel file from Data folder or specified path
3. **Generates concept IDs**: Uses concept_ids starting from 1000000 to avoid conflicts
4. **Inserts/Updates codes**: 
   - Inserts new codes if they don't exist
   - Updates existing codes if they already exist (based on concept_code + vocabulary_id)
5. **Sets metadata**:
   - `vocabulary_id`: 'ICD10CM'
   - `domain_id`: 'Condition'
   - `concept_class_id`: 'ICD10CM'
   - `concept_name`: Uses LONG DESCRIPTION if available, otherwise SHORT DESCRIPTION

## Environment Variables

The script uses the same database connection settings as the backend:
- `PGHOST` (default: localhost)
- `PGPORT` (default: 5432)
- `PGDATABASE` (default: hospital)
- `PGUSER` (default: hospital)
- `PGPASSWORD` (default: password)
- `PGSSL` (default: false)

## Output

The script provides progress updates and a summary:
- Number of codes inserted
- Number of codes updated
- Number of rows skipped (missing code or description)
- Any errors encountered

## Troubleshooting

1. **"Data directory not found"**: Create the `Data` folder at the project root
2. **"No Excel files found"**: Place an Excel file (.xlsx or .xls) in the Data folder
3. **Database connection errors**: Check your database connection settings in `.env` file
4. **"Vocabulary not found"**: Ensure migrations have been run (V009__vocabulary_core.sql)

