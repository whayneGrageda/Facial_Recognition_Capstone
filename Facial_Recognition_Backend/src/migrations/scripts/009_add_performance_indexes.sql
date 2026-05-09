-- Performance indexes for attendance queries at scale
-- These indexes support the most common query patterns and prevent full table scans

-- Index for user-specific attendance lookups (used by every recognition event)
CREATE INDEX IF NOT EXISTS idx_attendance_user_lookup 
ON attendance (user_id, user_type, timestamp DESC);

-- Index for date-based filtering (dashboard, stats, reports)
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp 
ON attendance (timestamp DESC);

-- Index for attendance type filtering
CREATE INDEX IF NOT EXISTS idx_attendance_type 
ON attendance (attendance_type);

-- Composite index for daily status checks (prevents duplicate time-in/time-out)
CREATE INDEX IF NOT EXISTS idx_attendance_daily_status 
ON attendance (user_id, user_type, DATE(timestamp), attendance_type);

-- Index for name-based user lookups (used by _find_user UNION query)
CREATE INDEX IF NOT EXISTS idx_users_name_lower ON users (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_shs_users_name_lower ON shs_users (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_faculty_users_name_lower ON faculty_users (LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_guests_name_lower ON guests (LOWER(TRIM(name)));
