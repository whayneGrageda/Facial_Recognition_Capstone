-- Seed default admin only (password: admin123)
-- Uses PostgreSQL's crypt function with bcrypt (requires pgcrypto extension)
INSERT INTO admins (username, email, password, role) VALUES
('admin', 'admin@facial-recognition.com', crypt('admin123', gen_salt('bf')), 'admin')
ON CONFLICT (username) DO NOTHING;

-- Note: Moderator account removed - create via admin panel if needed

