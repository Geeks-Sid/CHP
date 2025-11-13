CREATE TABLE IF NOT EXISTS person (
  person_id SERIAL PRIMARY KEY,
  user_id UUID UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  gender_concept_id INT NOT NULL,
  year_of_birth INT NOT NULL,
  month_of_birth INT,
  day_of_birth INT,
  birth_datetime TIMESTAMPTZ,
  race_concept_id INT,
  ethnicity_concept_id INT,
  person_source_value VARCHAR(100),
  mrn VARCHAR(40) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_person_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_person_user_id ON person(user_id);
CREATE INDEX IF NOT EXISTS idx_person_name ON person USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

CREATE TRIGGER person_set_timestamp
BEFORE UPDATE ON person
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

