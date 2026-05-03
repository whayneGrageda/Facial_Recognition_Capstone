-- Seed courses
INSERT INTO courses (name) VALUES
('Computer Science'),
('Information Technology'),
('Business Administration'),
('Accountancy'),
('Engineering')
ON CONFLICT DO NOTHING;

-- Seed years
INSERT INTO years (year_name) VALUES
('1st Year'),
('2nd Year'),
('3rd Year'),
('4th Year')
ON CONFLICT DO NOTHING;

-- Seed SHS strands
INSERT INTO shs_strands (name) VALUES
('STEM'),
('ABM'),
('HUMSS'),
('GAS'),
('TVL')
ON CONFLICT DO NOTHING;

-- Seed SHS grades
INSERT INTO shs_grades (grade_name) VALUES
('Grade 11'),
('Grade 12')
ON CONFLICT DO NOTHING;

-- Seed faculty departments
INSERT INTO faculty_department (department_name) VALUES
('Computer Science Department'),
('Business Administration Department'),
('Engineering Department'),
('Arts and Sciences Department'),
('Education Department')
ON CONFLICT DO NOTHING;
