# Data Folder

This folder contains data files for importing into the system.

## ICD-10 Codes

Place ICD-10 Excel files in this directory. The expected format is:

| CODE | SHORT DESCRIPTION (VALID ICD-10 FY2025) | LONG DESCRIPTION (VALID ICD-10 FY2025) |
|------|------------------------------------------|----------------------------------------|
| A000 | Cholera due to Vibrio cholerae 01, biovar cholerae | Cholera due to Vibrio cholerae 01, biovar cholerae |
| A001 | Cholera due to Vibrio cholerae 01, biovar eltor | Cholera due to Vibrio cholerae 01, biovar eltor |

### Importing ICD-10 Codes

To import ICD-10 codes from an Excel file:

```bash
# Option 1: From the backend directory using npm script
cd backend
npm run icd10:import

# Option 2: With a specific file
cd backend
npm run icd10:import -- --file ../Data/icd10-codes.xlsx

# Option 3: Using npx (from backend directory)
cd backend
npx icd-10 import

# Option 4: With file path
cd backend
npx icd-10 import --file ../Data/icd10-codes.xlsx
```

The script will:
1. Read the Excel file from the Data folder (or specified path)
2. Parse CODE, SHORT DESCRIPTION, and LONG DESCRIPTION columns
3. Ensure ICD10CM vocabulary exists in the vocabulary table
4. Insert/update codes into the `concept` table with vocabulary_id = 'ICD10CM'
5. Use LONG DESCRIPTION as the concept_name (or SHORT DESCRIPTION if LONG is empty)
6. Set domain_id = 'Condition' and concept_class_id = 'ICD10CM'

**Note:** The script will automatically:
- Skip rows without codes
- Update existing codes if they already exist (based on concept_code + vocabulary_id)
- Generate unique concept_ids starting from 1000000 to avoid conflicts
- Process in batches for better performance
