-- Replace the hash before deploying. This is an example bcrypt hash for "ChangeMe123!"
INSERT INTO users (username, password_hash, email)
VALUES ('admin', '$2b$12$5IOlL9h7o3q1oQ9u1G1O7eFq2kS7v3S6iN0X9x1m7y0uS1p1nR3Wa', 'admin@example.org')
ON CONFLICT (username) DO NOTHING;

INSERT INTO user_roles(user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE u.username='admin' AND r.role_name='Admin'
ON CONFLICT DO NOTHING;

