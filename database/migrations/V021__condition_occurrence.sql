-- V021: Create condition_occurrence table for diagnoses
-- Follows OMOP CDM standard for storing patient diagnoses/conditions

CREATE TABLE IF NOT EXISTS condition_occurrence (
  condition_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  condition_concept_id INT NOT NULL REFERENCES concept(concept_id),
  condition_start_date DATE NOT NULL,
  condition_start_datetime TIMESTAMPTZ,
  condition_end_date DATE,
  condition_end_datetime TIMESTAMPTZ,
  condition_type_concept_id INT NOT NULL,
  condition_status_concept_id INT,
  stop_reason TEXT,
  provider_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  visit_detail_id INT,
  condition_source_value TEXT,
  condition_source_concept_id INT,
  condition_status_source_value TEXT,
  diagnosis_category VARCHAR(20) CHECK (diagnosis_category IN ('Primary', 'Additional')),
  is_principal_diagnosis BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_condition_person ON condition_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_condition_visit ON condition_occurrence(visit_occurrence_id);
CREATE INDEX IF NOT EXISTS idx_condition_concept ON condition_occurrence(condition_concept_id);
CREATE INDEX IF NOT EXISTS idx_condition_dates ON condition_occurrence(condition_start_date, condition_end_date);
CREATE INDEX IF NOT EXISTS idx_condition_provider ON condition_occurrence(provider_id) WHERE provider_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_condition_principal ON condition_occurrence(person_id, is_principal_diagnosis) WHERE is_principal_diagnosis = true;
CREATE INDEX IF NOT EXISTS idx_condition_type ON condition_occurrence(condition_type_concept_id);

-- Timestamp trigger
CREATE TRIGGER condition_set_timestamp
BEFORE UPDATE ON condition_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON TABLE condition_occurrence IS 'Stores patient diagnoses/conditions following OMOP CDM standard';
COMMENT ON COLUMN condition_occurrence.condition_concept_id IS 'ICD-10 code from concept table';
COMMENT ON COLUMN condition_occurrence.condition_type_concept_id IS 'Diagnosis type: Chronic (32817), Acute (32827), Emergency (32828), Principal (32879), Provisional (32880)';
COMMENT ON COLUMN condition_occurrence.diagnosis_category IS 'Primary or Additional diagnosis';
COMMENT ON COLUMN condition_occurrence.is_principal_diagnosis IS 'Flags the main diagnosis for a visit (only one per visit)';
COMMENT ON COLUMN condition_occurrence.condition_start_date IS 'When diagnosis was made';
COMMENT ON COLUMN condition_occurrence.condition_end_date IS 'When condition resolved (null for active conditions)';

