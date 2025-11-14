-- Add contact information columns to person table
ALTER TABLE person
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);

-- Add indexes for contact information search (optional, but useful for lookups)
CREATE INDEX IF NOT EXISTS idx_person_contact_email ON person(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_person_contact_phone ON person(contact_phone) WHERE contact_phone IS NOT NULL;

