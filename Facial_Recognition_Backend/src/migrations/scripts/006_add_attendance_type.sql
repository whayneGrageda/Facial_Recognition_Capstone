-- Add attendance_type column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS attendance_type VARCHAR(10) DEFAULT 'time-in';

-- Add check constraint to ensure valid values (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_type_check') THEN
        ALTER TABLE attendance 
        ADD CONSTRAINT attendance_type_check 
        CHECK (attendance_type IN ('time-in', 'time-out'));
    END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_type ON attendance(attendance_type);
