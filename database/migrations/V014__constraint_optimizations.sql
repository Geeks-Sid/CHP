-- V014: Foreign Key Constraint Optimizations
-- Review and optimize cascade policies, ON DELETE behavior, and constraint deferral

-- ============================================================================
-- CONSTRAINT REVIEW AND OPTIMIZATION
-- ============================================================================

-- Note: Most constraints are already properly configured, but we'll review
-- and document the cascade policies for clarity and add any missing optimizations

-- ============================================================================
-- USERS TABLE CONSTRAINTS
-- ============================================================================

-- user_roles: CASCADE on delete is correct - when user is deleted, remove roles
-- refresh_tokens: CASCADE on delete is correct - when user is deleted, remove tokens
-- No changes needed - already optimal

-- ============================================================================
-- PERSON TABLE CONSTRAINTS
-- ============================================================================

-- person.user_id: SET NULL on delete is correct - preserve person data if user deleted
-- This is already set correctly in V004__person.sql
-- No changes needed

-- ============================================================================
-- VISIT_OCCURRENCE TABLE CONSTRAINTS
-- ============================================================================

-- visit_occurrence.person_id: CASCADE on delete is correct
-- When person is deleted, visits should be deleted (data integrity)
-- This is already set correctly in V005__visit_occurrence.sql

-- However, we should add a check constraint to ensure visit_end >= visit_start
ALTER TABLE visit_occurrence 
DROP CONSTRAINT IF EXISTS chk_visit_dates;

ALTER TABLE visit_occurrence 
ADD CONSTRAINT chk_visit_dates 
CHECK (visit_end IS NULL OR visit_end >= visit_start);

COMMENT ON CONSTRAINT chk_visit_dates ON visit_occurrence IS 
'Ensures visit end date is not before start date';

-- ============================================================================
-- PROCEDURE_OCCURRENCE TABLE CONSTRAINTS
-- ============================================================================

-- procedure_occurrence.person_id: CASCADE on delete is correct
-- procedure_occurrence.visit_occurrence_id: SET NULL on delete is correct
-- This allows procedures to exist even if visit is deleted (historical data)
-- No changes needed

-- ============================================================================
-- DRUG_EXPOSURE TABLE CONSTRAINTS
-- ============================================================================

-- drug_exposure.person_id: CASCADE on delete is correct
-- drug_exposure.visit_occurrence_id: SET NULL on delete is correct
-- This allows medications to exist even if visit is deleted (historical data)
-- No changes needed

-- Add check constraint for date range
ALTER TABLE drug_exposure 
DROP CONSTRAINT IF EXISTS chk_drug_dates;

ALTER TABLE drug_exposure 
ADD CONSTRAINT chk_drug_dates 
CHECK (drug_exposure_end IS NULL OR drug_exposure_end >= drug_exposure_start);

COMMENT ON CONSTRAINT chk_drug_dates ON drug_exposure IS 
'Ensures drug exposure end date is not before start date';

-- ============================================================================
-- DOCUMENT TABLE CONSTRAINTS
-- ============================================================================

-- document.owner_user_id: CASCADE on delete is correct
-- document.patient_person_id: CASCADE on delete is correct
-- document.uploaded_by: No ON DELETE specified - defaults to RESTRICT
-- This is correct - we don't want to delete documents if uploader is deleted
-- No changes needed

-- ============================================================================
-- CONCEPT TABLE CONSTRAINTS
-- ============================================================================

-- concept.vocabulary_id: RESTRICT on delete (default) is correct
-- We don't want to delete concepts if vocabulary is deleted
-- No changes needed

-- concept_relationship: CASCADE on delete is correct
-- concept_ancestor: CASCADE on delete is correct
-- When concept is deleted, relationships should be cleaned up
-- No changes needed

-- ============================================================================
-- DEFERRED CONSTRAINTS (if needed for complex transactions)
-- ============================================================================

-- For complex multi-table transactions, we might need deferred constraints
-- Currently, our transaction patterns don't require this, but we document
-- the pattern for future use:

-- Example (not applied, but documented):
-- ALTER TABLE visit_occurrence 
--   ALTER CONSTRAINT fk_visit_person 
--   DEFERRABLE INITIALLY DEFERRED;

-- ============================================================================
-- ADDITIONAL CHECK CONSTRAINTS
-- ============================================================================

-- Ensure year_of_birth is reasonable (not future, not too far in past)
ALTER TABLE person 
DROP CONSTRAINT IF EXISTS chk_person_birth_year;

ALTER TABLE person 
ADD CONSTRAINT chk_person_birth_year 
CHECK (
  year_of_birth >= EXTRACT(YEAR FROM CURRENT_DATE) - 150 
  AND year_of_birth <= EXTRACT(YEAR FROM CURRENT_DATE)
);

COMMENT ON CONSTRAINT chk_person_birth_year ON person IS 
'Ensures birth year is within reasonable range (not future, not more than 150 years ago)';

-- Ensure month_of_birth is valid (1-12)
ALTER TABLE person 
DROP CONSTRAINT IF EXISTS chk_person_birth_month;

ALTER TABLE person 
ADD CONSTRAINT chk_person_birth_month 
CHECK (month_of_birth IS NULL OR (month_of_birth >= 1 AND month_of_birth <= 12));

-- Ensure day_of_birth is valid (1-31)
ALTER TABLE person 
DROP CONSTRAINT IF EXISTS chk_person_birth_day;

ALTER TABLE person 
ADD CONSTRAINT chk_person_birth_day 
CHECK (day_of_birth IS NULL OR (day_of_birth >= 1 AND day_of_birth <= 31));

-- Ensure visit_type is one of allowed values
ALTER TABLE visit_occurrence 
DROP CONSTRAINT IF EXISTS chk_visit_type;

ALTER TABLE visit_occurrence 
ADD CONSTRAINT chk_visit_type 
CHECK (visit_type IN ('OPD', 'IPD', 'ER'));

COMMENT ON CONSTRAINT chk_visit_type ON visit_occurrence IS 
'Ensures visit type is one of: OPD (Outpatient), IPD (Inpatient), ER (Emergency)';

-- ============================================================================
-- INDEXES FOR FOREIGN KEYS (if not already created)
-- ============================================================================

-- Most FK indexes are already created, but ensure all are present for performance

-- Verify indexes exist (these should already be created in previous migrations)
-- If any are missing, they will be created here

CREATE INDEX IF NOT EXISTS idx_procedure_visit_fk 
ON procedure_occurrence(visit_occurrence_id) 
WHERE visit_occurrence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drug_visit_fk 
ON drug_exposure(visit_occurrence_id) 
WHERE visit_occurrence_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_uploaded_by 
ON document(uploaded_by) 
WHERE uploaded_by IS NOT NULL;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON CONSTRAINT fk_person_user ON person IS 
'User link is optional - SET NULL on delete preserves person data if user is deleted';

COMMENT ON CONSTRAINT fk_visit_person ON visit_occurrence IS 
'CASCADE on delete - visits are deleted when person is deleted for data integrity';

COMMENT ON CONSTRAINT fk_proc_visit ON procedure_occurrence IS 
'SET NULL on delete - procedures preserved even if visit is deleted (historical data)';

COMMENT ON CONSTRAINT fk_drug_visit ON drug_exposure IS 
'SET NULL on delete - medications preserved even if visit is deleted (historical data)';

