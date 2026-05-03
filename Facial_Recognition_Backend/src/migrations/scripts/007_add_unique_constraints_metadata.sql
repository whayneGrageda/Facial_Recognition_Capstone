-- Clean up duplicate entries and add unique constraints to metadata tables

-- Remove duplicate courses (keep the one with lowest id)
DELETE FROM courses a USING courses b 
WHERE a.id > b.id AND a.name = b.name;

-- Remove duplicate years
DELETE FROM years a USING years b 
WHERE a.id > b.id AND a.year_name = b.year_name;

-- Remove duplicate strands
DELETE FROM shs_strands a USING shs_strands b 
WHERE a.id > b.id AND a.name = b.name;

-- Remove duplicate grades
DELETE FROM shs_grades a USING shs_grades b 
WHERE a.id > b.id AND a.grade_name = b.grade_name;

-- Remove duplicate departments
DELETE FROM faculty_department a USING faculty_department b 
WHERE a.id > b.id AND a.department_name = b.department_name;

-- Add unique constraints to prevent future duplicates (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_name_unique') THEN
        ALTER TABLE courses ADD CONSTRAINT courses_name_unique UNIQUE (name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'years_year_name_unique') THEN
        ALTER TABLE years ADD CONSTRAINT years_year_name_unique UNIQUE (year_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shs_strands_name_unique') THEN
        ALTER TABLE shs_strands ADD CONSTRAINT shs_strands_name_unique UNIQUE (name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shs_grades_grade_name_unique') THEN
        ALTER TABLE shs_grades ADD CONSTRAINT shs_grades_grade_name_unique UNIQUE (grade_name);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'faculty_department_name_unique') THEN
        ALTER TABLE faculty_department ADD CONSTRAINT faculty_department_name_unique UNIQUE (department_name);
    END IF;
END $$;
