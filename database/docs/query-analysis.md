# Query Analysis & Optimization Guide

This document provides analysis of top queries and optimization strategies for the Hospital Management System database.

## Top 10 Queries Analysis

### 1. Patient Search by Name
**Query Pattern:**
```sql
SELECT person_id, first_name, last_name, mrn 
FROM person 
WHERE (first_name || ' ' || last_name) ILIKE '%search%'
ORDER BY person_id DESC 
LIMIT 20;
```

**Current Index:** `idx_person_name` (GIN trigram)
**Optimization:** ✅ Already optimized with GIN index
**EXPLAIN Output:**
```
Index Scan using idx_person_name on person
  (cost=0.00..X rows=Y width=Z)
```

### 2. Patient List with Pagination
**Query Pattern:**
```sql
SELECT person_id, first_name, last_name, mrn, created_at
FROM person
WHERE person_id < $1
ORDER BY person_id DESC
LIMIT 21;
```

**Current Index:** `idx_person_pagination` (composite: person_id DESC, created_at DESC)
**Optimization:** ✅ Added in V013
**Performance:** Excellent for cursor-based pagination

### 3. Visits by Patient with Date Range
**Query Pattern:**
```sql
SELECT visit_occurrence_id, visit_start, visit_end, visit_type
FROM visit_occurrence
WHERE person_id = $1
  AND visit_start >= $2
  AND visit_start <= $3
ORDER BY visit_start DESC;
```

**Current Index:** `idx_visit_person_dates` (composite: person_id, visit_start DESC, visit_end DESC)
**Optimization:** ✅ Added in V013
**Performance:** Optimal for patient visit history queries

### 4. Active Inpatient Visits Check
**Query Pattern:**
```sql
SELECT visit_occurrence_id
FROM visit_occurrence
WHERE person_id = $1
  AND visit_type = 'IPD'
  AND visit_end IS NULL;
```

**Current Index:** `idx_visit_active_ipd` (partial: person_id, visit_type, visit_start WHERE visit_type='IPD' AND visit_end IS NULL)
**Optimization:** ✅ Added in V013
**Performance:** Critical for overlap detection - very fast

### 5. User List with Role Filter
**Query Pattern:**
```sql
SELECT u.user_id, u.username, u.email, u.active, u.created_at
FROM users u
WHERE u.active = true
  AND u.created_at < $1
ORDER BY u.created_at DESC
LIMIT 21;
```

**Current Index:** `idx_users_active_created` (composite: active, created_at DESC WHERE active=true)
**Optimization:** ✅ Added in V013
**Performance:** Excellent for active user listing

### 6. User Search (Username/Email)
**Query Pattern:**
```sql
SELECT user_id, username, email
FROM users
WHERE (username ILIKE '%search%' OR email ILIKE '%search%')
  AND active = true;
```

**Current Index:** `idx_users_search` (GIN full-text WHERE active=true)
**Optimization:** ✅ Added in V013
**Performance:** Fast full-text search on active users

### 7. Medications by Patient
**Query Pattern:**
```sql
SELECT drug_exposure_id, drug_concept_id, drug_exposure_start, drug_exposure_end
FROM drug_exposure
WHERE person_id = $1
ORDER BY drug_exposure_start DESC
LIMIT 50;
```

**Current Index:** `idx_drug_person_dates` (composite: person_id, drug_exposure_start DESC, drug_exposure_end DESC)
**Optimization:** ✅ Added in V013
**Performance:** Optimal for medication history

### 8. Procedures by Visit
**Query Pattern:**
```sql
SELECT procedure_occurrence_id, procedure_concept_id, procedure_date
FROM procedure_occurrence
WHERE visit_occurrence_id = $1
ORDER BY procedure_date DESC;
```

**Current Index:** `idx_proc_visit_date` (composite: visit_occurrence_id, procedure_date DESC WHERE visit_occurrence_id IS NOT NULL)
**Optimization:** ✅ Added in V013
**Performance:** Fast lookup of visit procedures

### 9. Documents by Patient
**Query Pattern:**
```sql
SELECT document_id, file_name, uploaded_at
FROM document
WHERE patient_person_id = $1
  AND deleted_at IS NULL
ORDER BY uploaded_at DESC
LIMIT 20;
```

**Current Index:** `idx_doc_patient_uploaded` (composite: patient_person_id, uploaded_at DESC WHERE deleted_at IS NULL)
**Optimization:** ✅ Added in V013
**Performance:** Efficient patient document listing

### 10. Audit Log by User (Recent)
**Query Pattern:**
```sql
SELECT audit_id, action, resource_type, created_at
FROM audit_log
WHERE user_id = $1
  AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 100;
```

**Current Index:** `idx_audit_recent` (partial: created_at DESC WHERE created_at > NOW() - INTERVAL '90 days')
**Optimization:** ✅ Added in V013
**Performance:** Very fast for recent audit queries (covers 90% of use cases)

## Index Strategy Summary

### Composite Indexes
Composite indexes are used for queries that filter on multiple columns and sort:
- **Pattern:** Filter columns + Sort columns
- **Example:** `(person_id, visit_start DESC)` for patient visits sorted by date

### Partial Indexes
Partial indexes reduce index size and improve performance for filtered queries:
- **Pattern:** Index WHERE condition matches common query filter
- **Example:** `idx_users_active_created WHERE active = true`

### GIN Indexes
GIN indexes for full-text and array searches:
- **Pattern:** Text search with ILIKE or full-text search
- **Example:** `idx_person_name USING GIN (name gin_trgm_ops)`

## Fillfactor Optimization

Tables with frequent updates use lower fillfactor to reduce page splits:

- **audit_log:** fillfactor=90 (high insert rate)
- **refresh_tokens:** fillfactor=90 (frequent inserts/updates)
- **document:** fillfactor=95 (occasional soft-delete updates)
- **Other tables:** Default (100) - mostly read-heavy

## Query Performance Monitoring

### Key Metrics to Monitor

1. **Slow Query Log**
   ```sql
   -- Enable slow query logging (if using pg_stat_statements)
   SELECT * FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Index Usage**
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes
   ORDER BY idx_scan DESC;
   ```

3. **Table Statistics**
   ```sql
   -- Check table statistics freshness
   SELECT schemaname, tablename, last_analyze, last_autoanalyze
   FROM pg_stat_user_tables
   ORDER BY last_analyze DESC NULLS LAST;
   ```

### Recommended Maintenance

1. **Regular ANALYZE**
   ```sql
   -- Run weekly or after significant data changes
   ANALYZE;
   ```

2. **VACUUM**
   ```sql
   -- Run regularly (PostgreSQL auto-vacuum usually handles this)
   VACUUM ANALYZE;
   ```

3. **REINDEX** (if needed)
   ```sql
   -- Only if indexes become bloated (rare)
   REINDEX TABLE person;
   ```

## Optimization Checklist

- [x] Composite indexes for common query patterns
- [x] Partial indexes for filtered queries
- [x] GIN indexes for text search
- [x] Fillfactor tuning for high-update tables
- [x] Foreign key indexes
- [x] Check constraints for data integrity
- [x] Regular statistics updates (ANALYZE)

## Future Optimizations

### Consider if Query Volume Increases:

1. **Partitioning**
   - Partition `audit_log` by date (monthly partitions)
   - Partition large tables if they exceed 10GB

2. **Materialized Views**
   - Create materialized views for complex reporting queries
   - Refresh periodically or on-demand

3. **Read Replicas**
   - Use read replicas for reporting queries
   - Separate read/write workloads

4. **Connection Pooling**
   - Use PgBouncer for connection pooling
   - Reduce connection overhead

## Testing Query Performance

### Example EXPLAIN Analysis

```sql
-- Analyze a query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT person_id, first_name, last_name, mrn
FROM person
WHERE (first_name || ' ' || last_name) ILIKE '%john%'
ORDER BY person_id DESC
LIMIT 20;
```

### Key Metrics to Check:

1. **Execution Time:** Should be < 100ms for simple queries
2. **Index Usage:** Verify indexes are being used
3. **Buffer Hits:** High buffer hit ratio (> 95%) is good
4. **Rows Examined:** Should match rows returned (efficient)

## Troubleshooting Slow Queries

1. **Check if index is used:**
   ```sql
   EXPLAIN SELECT ...;
   -- Look for "Index Scan" or "Index Only Scan"
   ```

2. **Check statistics:**
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE tablename = 'person';
   -- Ensure last_analyze is recent
   ```

3. **Check for table bloat:**
   ```sql
   SELECT pg_size_pretty(pg_total_relation_size('person'));
   -- Compare with expected size
   ```

4. **Force index usage (if needed):**
   ```sql
   SET enable_seqscan = off;
   EXPLAIN SELECT ...;
   SET enable_seqscan = on;
   ```

