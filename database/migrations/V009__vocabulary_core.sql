CREATE TABLE IF NOT EXISTS vocabulary (
  vocabulary_id VARCHAR(20) PRIMARY KEY,
  vocabulary_name TEXT
);

CREATE TABLE IF NOT EXISTS concept (
  concept_id INT PRIMARY KEY,
  concept_name TEXT NOT NULL,
  vocabulary_id VARCHAR(20) NOT NULL REFERENCES vocabulary(vocabulary_id),
  concept_code TEXT NOT NULL,
  domain_id TEXT,
  concept_class_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_concept_vocab ON concept(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_concept_code ON concept(concept_code);
CREATE INDEX IF NOT EXISTS idx_concept_name_trgm ON concept USING GIN (concept_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS concept_relationship (
  concept_id_1 INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  concept_id_2 INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  relationship_id TEXT NOT NULL,
  PRIMARY KEY (concept_id_1, concept_id_2, relationship_id)
);

CREATE TABLE IF NOT EXISTS concept_ancestor (
  ancestor_concept_id INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  descendant_concept_id INT NOT NULL REFERENCES concept(concept_id) ON DELETE CASCADE,
  min_levels_of_separation INT,
  max_levels_of_separation INT,
  PRIMARY KEY (ancestor_concept_id, descendant_concept_id)
);

