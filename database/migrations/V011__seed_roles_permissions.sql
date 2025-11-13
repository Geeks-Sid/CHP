INSERT INTO roles (role_name, description) VALUES
  ('Admin','System administrator'),
  ('Doctor','Clinician'),
  ('Nurse','Nursing'),
  ('Receptionist','Front desk'),
  ('Pharmacist','Pharmacy'),
  ('Patient','Patient self-service')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO permissions (permission_name, description) VALUES
  ('user.create','Create users'), ('user.read','Read users'), ('user.update','Update users'), ('user.delete','Delete users'),
  ('patient.create','Create patients'), ('patient.read','Read patients'), ('patient.update','Update patients'), ('patient.delete','Delete patients'),
  ('visit.create','Create visits'), ('visit.read','Read visits'), ('visit.update','Update visits'), ('visit.delete','Delete visits'),
  ('procedure.create','Create procedures'), ('procedure.read','Read procedures'),
  ('medication.create','Create drug exposures'), ('medication.read','Read drug exposures'),
  ('document.upload','Upload documents'), ('document.read','Read documents'), ('document.delete','Delete documents'),
  ('fhir.read','Read FHIR resources'), ('reports.view','View reports'), ('audit.view','View audits')
ON CONFLICT (permission_name) DO NOTHING;

-- Map roles to permissions (subset examples)
WITH rp AS (
  SELECT role_id FROM roles WHERE role_name = 'Admin'
)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Admin'
ON CONFLICT DO NOTHING;

-- Doctors: common clinical permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r, permissions p
WHERE r.role_name = 'Doctor' AND p.permission_name IN (
  'patient.read','patient.update','visit.create','visit.read','procedure.create','procedure.read','medication.create','medication.read','document.read','fhir.read'
) ON CONFLICT DO NOTHING;

