CREATE TABLE IF NOT EXISTS document (
  document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  patient_person_id INT REFERENCES person(person_id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT,
  content_type VARCHAR(100),
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES users(user_id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_doc_owner ON document(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_doc_patient ON document(patient_person_id);

