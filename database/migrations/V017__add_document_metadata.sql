-- V017: Add Document Metadata Fields
-- Adds document_type and description columns to document table for medical records classification

-- Add document_type column
ALTER TABLE document 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(100);

-- Add description column
ALTER TABLE document 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index on document_type for filtering
CREATE INDEX IF NOT EXISTS idx_document_type ON document(document_type) WHERE document_type IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN document.document_type IS 'Type of document (e.g., Lab Result, Prescription, Physical Exam, Vaccination)';
COMMENT ON COLUMN document.description IS 'Optional description or notes about the document';

