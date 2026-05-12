-- Add is_active column to metadata tables
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE years 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE shs_strands 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE shs_grades 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE faculty_department 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing records to active
UPDATE courses SET is_active = true WHERE is_active IS NULL;
UPDATE years SET is_active = true WHERE is_active IS NULL;
UPDATE shs_strands SET is_active = true WHERE is_active IS NULL;
UPDATE shs_grades SET is_active = true WHERE is_active IS NULL;
UPDATE faculty_department SET is_active = true WHERE is_active IS NULL;
