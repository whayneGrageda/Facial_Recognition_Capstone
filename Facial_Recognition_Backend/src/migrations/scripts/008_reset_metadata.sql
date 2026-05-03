-- Properly seed metadata tables without destroying data

-- Seed courses (will have IDs 1-5)
INSERT INTO courses (name) VALUES
('Computer Science'),
('Information Technology'),
('Business Administration'),
('Accountancy'),
('Engineering')
ON CONFLICT (name) DO NOTHING;

-- Seed years (will have IDs 1-4)
INSERT INTO years (year_name) VALUES
('1st Year'),
('2nd Year'),
('3rd Year'),
('4th Year')
ON CONFLICT (year_name) DO NOTHING;

-- Seed SHS strands (will have IDs 1-5)
INSERT INTO shs_strands (name) VALUES
('STEM'),
('ABM'),
('HUMSS'),
('GAS'),
('TVL')
ON CONFLICT (name) DO NOTHING;

-- Seed SHS grades (will have IDs 1-2)
INSERT INTO shs_grades (grade_name) VALUES
('Grade 11'),
('Grade 12')
ON CONFLICT (grade_name) DO NOTHING;

-- Seed faculty departments (will have IDs 1-5)
INSERT INTO faculty_department (department_name) VALUES
('Computer Science Department'),
('Business Administration Department'),
('Engineering Department'),
('Arts and Sciences Department'),
('Education Department')
ON CONFLICT (department_name) DO NOTHING;
