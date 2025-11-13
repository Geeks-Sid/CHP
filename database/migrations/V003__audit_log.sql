CREATE TABLE IF NOT EXISTS audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action VARCHAR(20) NOT NULL,   -- READ|CREATE|UPDATE|DELETE|AUTH
  resource_type VARCHAR(50) NOT NULL,
  resource_id TEXT,
  ip INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_audit(
  p_user UUID, p_action TEXT, p_res_type TEXT, p_res_id TEXT, p_ip INET, p_ua TEXT, p_details JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_log(user_id, action, resource_type, resource_id, ip, user_agent, details)
  VALUES (p_user, p_action, p_res_type, p_res_id, p_ip, p_ua, p_details);
END;$$ LANGUAGE plpgsql;

