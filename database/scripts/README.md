# Database Scripts

This directory contains utility scripts for database operations.

## Sample Data Generation

### generate-sample-data.ts

Generates realistic sample data for development and demo purposes.

**Generated Data:**
- ~100 persons (patients) with realistic names and demographics
- ~200-300 visits (mix of OPD, IPD, ER)
- Associated procedures and medications
- Various date ranges (past year)

**Usage:**

```bash
# From backend directory
npm run db:generate-sample-data

# Or directly with ts-node
ts-node -r tsconfig-paths/register database/scripts/generate-sample-data.ts

# With custom environment variables
PGHOST=localhost PGPORT=5432 PGDATABASE=hospital_dev \
PGUSER=hospital PGPASSWORD=password \
ts-node database/scripts/generate-sample-data.ts
```

**Configuration:**

Edit the `CONFIG` object in the script to adjust:
- `PERSONS_COUNT`: Number of persons to generate (default: 100)
- `VISITS_PER_PERSON_MIN/MAX`: Visit count range per person
- `PROCEDURES_PER_VISIT_MIN/MAX`: Procedure count range
- `MEDICATIONS_PER_VISIT_MIN/MAX`: Medication count range

**Notes:**
- Script is idempotent - can be run multiple times
- Generates unique MRNs and visit numbers
- Uses realistic date ranges and relationships
- All timestamps use TIMESTAMPTZ (timezone-aware)

## Other Scripts

Additional utility scripts can be added here for:
- Data migration
- Bulk imports
- Data cleanup
- Reporting queries

