-- V013: Database Index Optimizations
-- This migration adds composite indexes and optimizes existing indexes
-- based on common query patterns and EXPLAIN analysis

-- ============================================================================
-- USERS TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for user listing with filters (active status + created_at for pagination)
CREATE INDEX IF NOT EXISTS idx_users_active_created 
ON users(active, created_at DESC) 
WHERE active = true;

-- Composite index for user search (username/email search with active filter)
CREATE INDEX IF NOT EXISTS idx_users_search 
ON users USING GIN (
  to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(email, ''))
) 
WHERE active = true;

-- Index for refresh token cleanup queries (revoked tokens cleanup)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked 
ON refresh_tokens(user_id, revoked_at) 
WHERE revoked_at IS NOT NULL;

-- Index for active refresh tokens lookup
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
ON refresh_tokens(user_id, issued_at DESC) 
WHERE revoked_at IS NULL;

-- ============================================================================
-- PERSON TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for patient search with gender filter
CREATE INDEX IF NOT EXISTS idx_person_gender_created 
ON person(gender_concept_id, created_at DESC);

-- Composite index for DOB-based queries (common for age-based searches)
CREATE INDEX IF NOT EXISTS idx_person_dob 
ON person(year_of_birth, month_of_birth, day_of_birth);

-- Partial index for active patients (those with MRN)
CREATE INDEX IF NOT EXISTS idx_person_mrn_active 
ON person(mrn) 
WHERE mrn IS NOT NULL;

-- Composite index for pagination with filters
CREATE INDEX IF NOT EXISTS idx_person_pagination 
ON person(person_id DESC, created_at DESC);

-- ============================================================================
-- VISIT_OCCURRENCE TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for person visits with date range (most common query)
CREATE INDEX IF NOT EXISTS idx_visit_person_dates 
ON visit_occurrence(person_id, visit_start DESC, visit_end DESC NULLS LAST);

-- Composite index for active inpatient visits (overlap detection)
CREATE INDEX IF NOT EXISTS idx_visit_active_ipd 
ON visit_occurrence(person_id, visit_type, visit_start) 
WHERE visit_type = 'IPD' AND visit_end IS NULL;

-- Composite index for provider visits with date range
CREATE INDEX IF NOT EXISTS idx_visit_provider_dates 
ON visit_occurrence(provider_id, visit_start DESC) 
WHERE provider_id IS NOT NULL;

-- Composite index for visit type and date range queries
CREATE INDEX IF NOT EXISTS idx_visit_type_dates 
ON visit_occurrence(visit_type, visit_start DESC, visit_end DESC NULLS LAST);

-- Index for visit number lookups (already unique, but ensure fast lookups)
-- Note: UNIQUE constraint already creates an index, but we can optimize for reads
-- No additional index needed as UNIQUE already provides optimal lookup

-- ============================================================================
-- PROCEDURE_OCCURRENCE TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for person procedures with date
CREATE INDEX IF NOT EXISTS idx_proc_person_date 
ON procedure_occurrence(person_id, procedure_date DESC);

-- Composite index for visit procedures
CREATE INDEX IF NOT EXISTS idx_proc_visit_date 
ON procedure_occurrence(visit_occurrence_id, procedure_date DESC) 
WHERE visit_occurrence_id IS NOT NULL;

-- Composite index for procedure concept lookups with date
CREATE INDEX IF NOT EXISTS idx_proc_concept_date 
ON procedure_occurrence(procedure_concept_id, procedure_date DESC);

-- ============================================================================
-- DRUG_EXPOSURE TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for person medications with date range
CREATE INDEX IF NOT EXISTS idx_drug_person_dates 
ON drug_exposure(person_id, drug_exposure_start DESC, drug_exposure_end DESC NULLS LAST);

-- Composite index for visit medications
CREATE INDEX IF NOT EXISTS idx_drug_visit_dates 
ON drug_exposure(visit_occurrence_id, drug_exposure_start DESC) 
WHERE visit_occurrence_id IS NOT NULL;

-- Composite index for active medications (ongoing treatments)
CREATE INDEX IF NOT EXISTS idx_drug_active 
ON drug_exposure(person_id, drug_exposure_start DESC) 
WHERE drug_exposure_end IS NULL;

-- Composite index for drug concept lookups
CREATE INDEX IF NOT EXISTS idx_drug_concept_dates 
ON drug_exposure(drug_concept_id, drug_exposure_start DESC);

-- ============================================================================
-- DOCUMENT TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for document listing with pagination
CREATE INDEX IF NOT EXISTS idx_doc_owner_uploaded 
ON document(owner_user_id, uploaded_at DESC) 
WHERE deleted_at IS NULL;

-- Composite index for patient documents
CREATE INDEX IF NOT EXISTS idx_doc_patient_uploaded 
ON document(patient_person_id, uploaded_at DESC) 
WHERE deleted_at IS NULL AND patient_person_id IS NOT NULL;

-- Index for soft-delete queries (cleanup of old deleted documents)
CREATE INDEX IF NOT EXISTS idx_doc_deleted 
ON document(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- ============================================================================
-- AUDIT_LOG TABLE OPTIMIZATIONS
-- ============================================================================

-- Composite index for user audit log queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_user_created 
ON audit_log(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Composite index for resource-based audit queries
CREATE INDEX IF NOT EXISTS idx_audit_resource 
ON audit_log(resource_type, resource_id, created_at DESC);

-- Composite index for action-based queries
CREATE INDEX IF NOT EXISTS idx_audit_action_created 
ON audit_log(action, created_at DESC);

-- Partial index for recent audits (last 90 days - most queries are recent)
CREATE INDEX IF NOT EXISTS idx_audit_recent 
ON audit_log(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '90 days';

-- ============================================================================
-- USER_ROLES TABLE OPTIMIZATIONS
-- ============================================================================

-- Index already exists via PRIMARY KEY, but add reverse lookup for role->users
CREATE INDEX IF NOT EXISTS idx_user_roles_role 
ON user_roles(role_id, user_id);

-- ============================================================================
-- CONCEPT TABLE OPTIMIZATIONS (Vocabulary)
-- ============================================================================

-- Composite index for vocabulary + code lookups (common pattern)
CREATE INDEX IF NOT EXISTS idx_concept_vocab_code 
ON concept(vocabulary_id, concept_code);

-- Composite index for domain + class queries
CREATE INDEX IF NOT EXISTS idx_concept_domain_class 
ON concept(domain_id, concept_class_id) 
WHERE domain_id IS NOT NULL AND concept_class_id IS NOT NULL;

-- ============================================================================
-- FILLFACTOR OPTIMIZATIONS
-- ============================================================================
-- Set fillfactor for tables with frequent updates to reduce page splits

-- Audit log: High update rate, set lower fillfactor
ALTER TABLE audit_log SET (fillfactor = 90);

-- Refresh tokens: Frequent inserts/updates (revocations)
ALTER TABLE refresh_tokens SET (fillfactor = 90);

-- Documents: Occasional updates (soft deletes)
ALTER TABLE document SET (fillfactor = 95);

-- ============================================================================
-- STATISTICS UPDATES
-- ============================================================================
-- Update table statistics for better query planning

ANALYZE users;
ANALYZE user_roles;
ANALYZE refresh_tokens;
ANALYZE person;
ANALYZE visit_occurrence;
ANALYZE procedure_occurrence;
ANALYZE drug_exposure;
ANALYZE document;
ANALYZE audit_log;
ANALYZE concept;
ANALYZE concept_relationship;
ANALYZE concept_ancestor;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_visit_person_dates IS 
'Optimizes queries for person visits with date range filtering - most common query pattern';

COMMENT ON INDEX idx_visit_active_ipd IS 
'Optimizes overlap detection for active inpatient visits - critical for business logic';

COMMENT ON INDEX idx_person_gender_created IS 
'Optimizes patient listing with gender filter and pagination';

COMMENT ON INDEX idx_audit_recent IS 
'Partial index for recent audit logs - covers 90% of queries which are for recent data';

