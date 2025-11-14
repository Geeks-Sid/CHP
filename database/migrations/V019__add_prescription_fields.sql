-- Add prescription fields to drug_exposure table
ALTER TABLE drug_exposure
ADD COLUMN IF NOT EXISTS prescription_status VARCHAR(20) DEFAULT 'Pending' CHECK (prescription_status IN ('Pending', 'Filled', 'Cancelled')),
ADD COLUMN IF NOT EXISTS prescribed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS filled_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS filled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS prescription_number VARCHAR(50) UNIQUE;

-- Create sequence for prescription numbers
CREATE SEQUENCE IF NOT EXISTS seq_prescription START 100000;

-- Add indexes for prescription queries
CREATE INDEX IF NOT EXISTS idx_drug_prescription_status ON drug_exposure(prescription_status) WHERE prescription_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drug_prescribed_by ON drug_exposure(prescribed_by) WHERE prescribed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drug_filled_by ON drug_exposure(filled_by) WHERE filled_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drug_prescription_number ON drug_exposure(prescription_number) WHERE prescription_number IS NOT NULL;

-- Add comments
COMMENT ON COLUMN drug_exposure.prescription_status IS 'Status of prescription: Pending, Filled, or Cancelled';
COMMENT ON COLUMN drug_exposure.prescribed_by IS 'User ID of the clinician who prescribed the medication';
COMMENT ON COLUMN drug_exposure.filled_by IS 'User ID of the pharmacist who filled the prescription';
COMMENT ON COLUMN drug_exposure.filled_at IS 'Timestamp when prescription was filled';
COMMENT ON COLUMN drug_exposure.prescription_number IS 'Unique prescription number (e.g., RX-2024-000123)';

