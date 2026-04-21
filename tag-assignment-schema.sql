-- ===========================================
-- TAG ASSIGNMENT SCHEMA UPDATE
-- ===========================================

-- 1. Add Tag Columns to Equipment
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS nfc_tag TEXT UNIQUE;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS qr_code_tag TEXT UNIQUE;

-- 2. Create Index for faster lookups during scan
CREATE INDEX IF NOT EXISTS idx_equipment_nfc_tag ON equipment(nfc_tag);
CREATE INDEX IF NOT EXISTS idx_equipment_qr_code_tag ON equipment(qr_code_tag);
