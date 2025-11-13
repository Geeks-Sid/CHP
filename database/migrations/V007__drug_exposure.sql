CREATE TABLE IF NOT EXISTS drug_exposure (
  drug_exposure_id SERIAL PRIMARY KEY,
  person_id INT NOT NULL REFERENCES person(person_id) ON DELETE CASCADE,
  drug_concept_id INT NOT NULL,
  drug_exposure_start TIMESTAMPTZ NOT NULL,
  drug_exposure_end TIMESTAMPTZ,
  drug_type_concept_id INT NOT NULL,
  quantity NUMERIC,
  visit_occurrence_id INT REFERENCES visit_occurrence(visit_occurrence_id) ON DELETE SET NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drug_person ON drug_exposure(person_id);
CREATE INDEX IF NOT EXISTS idx_drug_visit ON drug_exposure(visit_occurrence_id);

CREATE TRIGGER drug_set_timestamp
BEFORE UPDATE ON drug_exposure
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

