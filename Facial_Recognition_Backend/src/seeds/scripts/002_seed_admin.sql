-- Seed default admin (password: admin123)
-- Uses PostgreSQL's crypt function with bcrypt (requires pgcrypto extension)
INSERT INTO admins (username, email, password, role) VALUES
('admin', 'admin@facial-recognition.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;

-- Seed default moderator (password: moderator123)
INSERT INTO moderators (username, email, password, role) VALUES
('moderator', 'moderator@facial-recognition.com', crypt('moderator123', gen_salt('bf')), 'moderator')
ON CONFLICT (username) DO NOTHING;
