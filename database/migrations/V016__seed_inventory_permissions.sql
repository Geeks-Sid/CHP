-- V016: Add Inventory Management Permissions
-- Adds permissions for inventory management and assigns them to appropriate roles

-- Add inventory permissions
INSERT INTO permissions (permission_name, description) VALUES
  ('inventory.create', 'Create inventory items'),
  ('inventory.read', 'Read inventory items'),
  ('inventory.update', 'Update inventory items'),
  ('inventory.delete', 'Delete inventory items')
ON CONFLICT (permission_name) DO NOTHING;

-- Admin gets all inventory permissions
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Admin' AND p.permission_name LIKE 'inventory.%'
ON CONFLICT DO NOTHING;

-- Pharmacist gets inventory read and update permissions (for stock management)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Pharmacist' AND p.permission_name IN ('inventory.read', 'inventory.update', 'inventory.create')
ON CONFLICT DO NOTHING;

-- Receptionist gets inventory read permission (for checking stock)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Receptionist' AND p.permission_name = 'inventory.read'
ON CONFLICT DO NOTHING;

-- Nurse gets inventory read permission (for checking stock)
INSERT INTO role_permissions(role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.role_name = 'Nurse' AND p.permission_name = 'inventory.read'
ON CONFLICT DO NOTHING;

