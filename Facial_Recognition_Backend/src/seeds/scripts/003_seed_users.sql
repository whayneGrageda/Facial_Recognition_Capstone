-- Seed College Users (password: password123)
INSERT INTO users (student_id, first_name, last_name, email, password, course_id, year_id, status) VALUES
('2021-00001', 'Juan', 'Dela Cruz', 'juan.delacruz@college.edu', crypt('password123', gen_salt('bf')), 1, 1, 'active'),
('2021-00002', 'Maria', 'Santos', 'maria.santos@college.edu', crypt('password123', gen_salt('bf')), 1, 1, 'active'),
('2021-00003', 'Pedro', 'Reyes', 'pedro.reyes@college.edu', crypt('password123', gen_salt('bf')), 2, 2, 'active'),
('2021-00004', 'Ana', 'Garcia', 'ana.garcia@college.edu', crypt('password123', gen_salt('bf')), 2, 2, 'active'),
('2021-00005', 'Jose', 'Martinez', 'jose.martinez@college.edu', crypt('password123', gen_salt('bf')), 3, 3, 'active'),
('2021-00006', 'Carmen', 'Lopez', 'carmen.lopez@college.edu', crypt('password123', gen_salt('bf')), 3, 3, 'active'),
('2021-00007', 'Miguel', 'Fernandez', 'miguel.fernandez@college.edu', crypt('password123', gen_salt('bf')), 4, 4, 'active'),
('2021-00008', 'Sofia', 'Rodriguez', 'sofia.rodriguez@college.edu', crypt('password123', gen_salt('bf')), 4, 4, 'active'),
('2021-00009', 'Luis', 'Gonzalez', 'luis.gonzalez@college.edu', crypt('password123', gen_salt('bf')), 5, 1, 'active'),
('2021-00010', 'Isabella', 'Hernandez', 'isabella.hernandez@college.edu', crypt('password123', gen_salt('bf')), 5, 2, 'active'),
('2021-00011', 'Carlos', 'Diaz', 'carlos.diaz@college.edu', crypt('password123', gen_salt('bf')), 1, 3, 'active'),
('2021-00012', 'Elena', 'Torres', 'elena.torres@college.edu', crypt('password123', gen_salt('bf')), 2, 4, 'active'),
('2021-00013', 'Ricardo', 'Ramirez', 'ricardo.ramirez@college.edu', crypt('password123', gen_salt('bf')), 3, 1, 'active'),
('2021-00014', 'Lucia', 'Flores', 'lucia.flores@college.edu', crypt('password123', gen_salt('bf')), 4, 2, 'active'),
('2021-00015', 'Fernando', 'Cruz', 'fernando.cruz@college.edu', crypt('password123', gen_salt('bf')), 5, 3, 'active')
ON CONFLICT (student_id) DO NOTHING;

-- Seed SHS Users (password: password123)
INSERT INTO shs_users (student_id, first_name, last_name, email, password, strand_id, grade_id, status) VALUES
('SHS-2023-001', 'Gabriel', 'Morales', 'gabriel.morales@shs.edu', crypt('password123', gen_salt('bf')), 1, 1, 'active'),
('SHS-2023-002', 'Valentina', 'Castillo', 'valentina.castillo@shs.edu', crypt('password123', gen_salt('bf')), 1, 1, 'active'),
('SHS-2023-003', 'Diego', 'Jimenez', 'diego.jimenez@shs.edu', crypt('password123', gen_salt('bf')), 2, 2, 'active'),
('SHS-2023-004', 'Camila', 'Ruiz', 'camila.ruiz@shs.edu', crypt('password123', gen_salt('bf')), 2, 2, 'active'),
('SHS-2023-005', 'Mateo', 'Alvarez', 'mateo.alvarez@shs.edu', crypt('password123', gen_salt('bf')), 3, 1, 'active'),
('SHS-2023-006', 'Emma', 'Mendoza', 'emma.mendoza@shs.edu', crypt('password123', gen_salt('bf')), 3, 1, 'active'),
('SHS-2023-007', 'Sebastian', 'Ortiz', 'sebastian.ortiz@shs.edu', crypt('password123', gen_salt('bf')), 4, 2, 'active'),
('SHS-2023-008', 'Mia', 'Vargas', 'mia.vargas@shs.edu', crypt('password123', gen_salt('bf')), 4, 2, 'active'),
('SHS-2023-009', 'Lucas', 'Romero', 'lucas.romero@shs.edu', crypt('password123', gen_salt('bf')), 5, 1, 'active'),
('SHS-2023-010', 'Olivia', 'Navarro', 'olivia.navarro@shs.edu', crypt('password123', gen_salt('bf')), 5, 1, 'active')
ON CONFLICT (email) DO NOTHING;

-- Seed Faculty Users (password: password123)
INSERT INTO faculty_users (first_name, last_name, email, password, department_id, status) VALUES
('Dr. Roberto', 'Aquino', 'roberto.aquino@faculty.edu', crypt('password123', gen_salt('bf')), 1, 'active'),
('Prof. Angela', 'Bautista', 'angela.bautista@faculty.edu', crypt('password123', gen_salt('bf')), 1, 'active'),
('Dr. Manuel', 'Castro', 'manuel.castro@faculty.edu', crypt('password123', gen_salt('bf')), 2, 'active'),
('Prof. Teresa', 'Domingo', 'teresa.domingo@faculty.edu', crypt('password123', gen_salt('bf')), 2, 'active'),
('Dr. Francisco', 'Estrada', 'francisco.estrada@faculty.edu', crypt('password123', gen_salt('bf')), 3, 'active'),
('Prof. Gloria', 'Fuentes', 'gloria.fuentes@faculty.edu', crypt('password123', gen_salt('bf')), 3, 'active'),
('Dr. Enrique', 'Gutierrez', 'enrique.gutierrez@faculty.edu', crypt('password123', gen_salt('bf')), 4, 'active'),
('Prof. Patricia', 'Herrera', 'patricia.herrera@faculty.edu', crypt('password123', gen_salt('bf')), 4, 'active'),
('Dr. Alberto', 'Iglesias', 'alberto.iglesias@faculty.edu', crypt('password123', gen_salt('bf')), 5, 'active'),
('Prof. Rosa', 'Jimenez', 'rosa.jimenez@faculty.edu', crypt('password123', gen_salt('bf')), 5, 'active')
ON CONFLICT (email) DO NOTHING;

-- Seed Guest Users
INSERT INTO guests (name, purpose, visit_date, status) VALUES
('John Smith', 'Campus Tour', CURRENT_DATE, 'active'),
('Emily Johnson', 'Job Interview', CURRENT_DATE, 'active'),
('Michael Williams', 'Conference Attendee', CURRENT_DATE, 'active'),
('Sarah Brown', 'Research Collaboration', CURRENT_DATE, 'active'),
('David Jones', 'Guest Lecturer', CURRENT_DATE, 'active');
-- No ON CONFLICT since guests table has no unique constraints
