# Database Optimization & Management

This directory contains database migrations, optimization scripts, and documentation for the Hospital Management System.

## Structure

```
database/
├── migrations/          # SQL migration files (Flyway-style)
│   ├── V000__extensions_and_baseline.sql
│   ├── V001__roles_permissions.sql
│   ├── ...
│   ├── V013__index_optimizations.sql  # Index optimizations
│   └── V014__constraint_optimizations.sql  # Constraint optimizations
├── scripts/             # Utility scripts
│   ├── generate-sample-data.ts  # Sample data generation
│   └── README.md
├── docs/                # Documentation
│   ├── query-analysis.md  # Query performance analysis
│   └── timezone-policy.md  # Timezone handling guide
└── docker-compose.yml   # Local database setup
```

## Migrations

### Running Migrations

```bash
# Apply all migrations
flyway migrate -url=jdbc:postgresql://localhost:5432/hospital \
  -user=hospital -password=password

# Or using custom script
npm run migrate:dev
```

### Migration Files

- **V000-V012**: Core schema and seed data
- **V013**: Index optimizations (composite indexes, partial indexes, fillfactor)
- **V014**: Constraint optimizations (check constraints, FK policies)

## Index Optimizations (V013)

### Composite Indexes
Added composite indexes for common query patterns:
- `idx_visit_person_dates` - Person visits with date range
- `idx_visit_active_ipd` - Active inpatient visits (overlap detection)
- `idx_person_gender_created` - Patient listing with filters
- `idx_users_active_created` - Active user listing
- And many more...

### Partial Indexes
Partial indexes for filtered queries:
- `idx_users_active_created WHERE active = true`
- `idx_audit_recent WHERE created_at > NOW() - INTERVAL '90 days'`
- `idx_visit_active_ipd WHERE visit_type = 'IPD' AND visit_end IS NULL`

### Fillfactor Tuning
Optimized fillfactor for high-update tables:
- `audit_log`: fillfactor=90
- `refresh_tokens`: fillfactor=90
- `document`: fillfactor=95

See `migrations/V013__index_optimizations.sql` for complete list.

## Constraint Optimizations (V014)

### Check Constraints
Added data integrity constraints:
- Visit dates: `visit_end >= visit_start`
- Drug exposure dates: `drug_exposure_end >= drug_exposure_start`
- Birth year: Reasonable range (not future, not >150 years ago)
- Visit type: Must be OPD, IPD, or ER

### Foreign Key Policies
Reviewed and documented cascade policies:
- **CASCADE**: When parent deleted, children deleted (visits, procedures, medications)
- **SET NULL**: When parent deleted, preserve child data (procedures/medications if visit deleted)
- **RESTRICT**: Prevent deletion if children exist (concepts if vocabulary deleted)

See `migrations/V014__constraint_optimizations.sql` for details.

## Sample Data Generation

Generate realistic test data for development:

```bash
# From backend directory
npm run db:generate-sample-data

# Or directly
ts-node database/scripts/generate-sample-data.ts
```

**Generates:**
- ~100 persons (patients)
- ~200-300 visits
- Associated procedures and medications
- Realistic date ranges and relationships

See `scripts/README.md` for configuration options.

## Query Performance

### Top Queries Analysis
See `docs/query-analysis.md` for:
- Top 10 query patterns
- Index usage analysis
- Performance optimization strategies
- Monitoring recommendations

### Key Metrics
- **Execution Time**: < 100ms for simple queries
- **Index Usage**: > 95% of queries use indexes
- **Buffer Hit Ratio**: > 95% (data in memory)

## Timezone Policy

All timestamps use `TIMESTAMPTZ` (timezone-aware):
- Stored in UTC in database
- Converted at application edge (API layer)
- Returned as ISO 8601 strings in UTC

See `docs/timezone-policy.md` for complete guide.

## Pagination

Centralized pagination utility in `backend/src/utils/pagination.util.ts`:
- Opaque cursor encoding/decoding
- Default limit: 20
- Maximum limit: 100
- Type-safe cursor extraction

**Usage:**
```typescript
import { parsePaginationOptions, createPaginationResult, CursorExtractors } from '@/utils/pagination.util';

const { limit, cursor } = parsePaginationOptions(query);
const result = createPaginationResult(items, limit, CursorExtractors.idAndCreatedAt);
```

## Maintenance

### Regular Tasks

1. **ANALYZE** (weekly or after significant changes)
   ```sql
   ANALYZE;
   ```

2. **VACUUM** (auto-vacuum handles this, but can run manually)
   ```sql
   VACUUM ANALYZE;
   ```

3. **Monitor Index Usage**
   ```sql
   SELECT * FROM pg_stat_user_indexes 
   ORDER BY idx_scan DESC;
   ```

4. **Check Table Statistics**
   ```sql
   SELECT schemaname, tablename, last_analyze 
   FROM pg_stat_user_tables;
   ```

## Performance Monitoring

### Key Queries to Monitor

1. Slow queries (> 100ms)
2. Index usage statistics
3. Table bloat
4. Connection pool usage
5. Lock contention

### Tools

- **pg_stat_statements**: Query performance statistics
- **EXPLAIN ANALYZE**: Query plan analysis
- **pgAdmin**: Visual query analysis
- **Grafana**: Performance dashboards

## Best Practices

1. ✅ Always use `TIMESTAMPTZ` for timestamps
2. ✅ Use composite indexes for multi-column queries
3. ✅ Use partial indexes for filtered queries
4. ✅ Set appropriate fillfactor for high-update tables
5. ✅ Use cursor-based pagination for large datasets
6. ✅ Regular ANALYZE for query planner
7. ✅ Monitor index usage and remove unused indexes
8. ✅ Use EXPLAIN ANALYZE before adding new indexes

## Troubleshooting

### Slow Queries

1. Check if index is being used: `EXPLAIN SELECT ...`
2. Verify statistics are up to date: `SELECT last_analyze FROM pg_stat_user_tables`
3. Check for table bloat: `SELECT pg_size_pretty(pg_total_relation_size('table_name'))`
4. Review query plan: Look for sequential scans on large tables

### Missing Indexes

1. Identify slow queries
2. Run `EXPLAIN ANALYZE` to see query plan
3. Add appropriate index
4. Verify improvement with `EXPLAIN ANALYZE`

### Index Bloat

1. Check index size: `SELECT pg_size_pretty(pg_relation_size('index_name'))`
2. Rebuild if needed: `REINDEX INDEX index_name`
3. Consider fillfactor adjustment

## References

- [Query Analysis Guide](./docs/query-analysis.md)
- [Timezone Policy](./docs/timezone-policy.md)
- [Sample Data Scripts](./scripts/README.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

