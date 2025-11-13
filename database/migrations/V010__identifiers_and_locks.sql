-- Sequence tables for MRN and Visits (string formats composed in app layer)
CREATE SEQUENCE IF NOT EXISTS seq_mrn START 100000;
CREATE SEQUENCE IF NOT EXISTS seq_visit START 100000;

-- Advisory lock helpers (patterns only; locking done in app layer with pg_try_advisory_lock)
-- No SQL function needed here; we will use SELECT pg_advisory_lock(key) in code.

