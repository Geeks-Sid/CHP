CREATE TABLE IF NOT EXISTS procedure_occurrence (
  procedure_occurrence_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  procedure_concept_id INT NOT NULL,
  procedure_date TIMESTAMPTZ NOT NULL,
  procedure_type_concept_id INT NOT NULL,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proc_person ON procedure_occurrence(person_id);
CREATE INDEX IF NOT EXISTS idx_proc_visit ON procedure_occurrence(visit_occurrence_id);

CREATE TRIGGER proc_set_timestamp
BEFORE UPDATE ON procedure_occurrence
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

