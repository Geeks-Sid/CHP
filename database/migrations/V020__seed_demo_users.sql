-- Seed demo users for testing authentication
-- All users have password: "Password123!" (hashed with bcrypt, 12 rounds)
-- Hash: $2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW

-- Add Warehouse Manager role if it doesn't exist
INSERT INTO roles (role_name, description) VALUES
  ('Warehouse Manager', 'Warehouse and inventory management')
ON CONFLICT (role_name) DO NOTHING;

-- Insert demo users
-- Patient user
INSERT INTO users (username, password_hash, email)
VALUES ('patient@example.com', '$2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW', 'patient@example.com')
ON CONFLICT (username) DO NOTHING;

-- Receptionist user
INSERT INTO users (username, password_hash, email)
VALUES ('receptionist@example.com', '$2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW', 'receptionist@example.com')
ON CONFLICT (username) DO NOTHING;

-- Clinician/Doctor user
INSERT INTO users (username, password_hash, email)
VALUES ('clinician@example.com', '$2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW', 'clinician@example.com')
ON CONFLICT (username) DO NOTHING;

-- Pharmacy user
INSERT INTO users (username, password_hash, email)
VALUES ('pharmacy@example.com', '$2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW', 'pharmacy@example.com')
ON CONFLICT (username) DO NOTHING;

-- Warehouse Manager user
INSERT INTO users (username, password_hash, email)
VALUES ('warehouse@example.com', '$2a$12$s3NpQcbwVIRaBLHlSeHJwO/ihuWgrh.zpkVEPACEymoBeZEbpw5rW', 'warehouse@example.com')
ON CONFLICT (username) DO NOTHING;

-- Assign roles to users
-- Patient role
INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='patient@example.com' AND r.role_name='Patient'
ON CONFLICT DO NOTHING;

-- Receptionist role
INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='receptionist@example.com' AND r.role_name='Receptionist'
ON CONFLICT DO NOTHING;

-- Doctor role for clinician
INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='clinician@example.com' AND r.role_name='Doctor'
ON CONFLICT DO NOTHING;

-- Pharmacist role
INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='pharmacy@example.com' AND r.role_name='Pharmacist'
ON CONFLICT DO NOTHING;

-- Warehouse Manager role
INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='warehouse@example.com' AND r.role_name='Warehouse Manager'
ON CONFLICT DO NOTHING;

