CREATE TABLE IF NOT EXISTS visit_occurrence (
  visit_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  visit_concept_id INT NOT NULL,
  visit_start TIMESTAMPTZ NOT NULL,
  visit_end TIMESTAMPTZ,
  visit_type VARCHAR(10) NOT NULL,   -- OPD|IPD|ER
  department_id INT,
  provider_id UUID,
  reason TEXT,
  visit_number VARCHAR(40) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_person ON visit_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_visit_dates ON visit_occurrence(visit_start, visit_end);

CREATE TRIGGER visit_set_timestamp
BEFORE UPDATE ON visit_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

