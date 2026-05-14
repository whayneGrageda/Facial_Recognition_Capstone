-- ============================================================
-- AUTO-GENERATED USER SEED
-- Generated: 2026-05-14T00:26:07.991Z
-- DO NOT EDIT MANUALLY — regenerated on every user registration
-- Run this file to restore all users after a database wipe.
-- ============================================================

-- Requires pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- College Users
INSERT INTO users (first_name, middle_initial, last_name, name, email, contact_number, student_id, password, course_id, year_id, role, status, registered_at) VALUES ('Whayne ', 'B', 'Grageda', 'Whayne B Grageda', 'gragedawb@students.nu-dasma.edu.ph', '09770071720', '2022-172477', '$2a$10$kSHHVNpfiUVaBz2dHI1OOueI1mtv4P9B2onPUXmBD.HzpPliJ0oTW', 2, 4, 'student', 'active', NOW()) ON CONFLICT (student_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password = EXCLUDED.password;

-- Moderators
INSERT INTO moderators (username, email, password, role, status) VALUES ('moderato', 'moderator@gmail.com', '$2a$10$JJl7UPRxXyUsNhcP4eRTge5DcFkbI/nZq.pEeHC.DyuVxa49Em9au', 'moderator', 'active') ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password;
