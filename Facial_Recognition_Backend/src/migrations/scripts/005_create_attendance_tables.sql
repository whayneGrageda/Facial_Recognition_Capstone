-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type user_type_enum DEFAULT 'college',
    name VARCHAR,
    timestamp TIMESTAMP,
    attendance_type VARCHAR DEFAULT 'time-in'
);

-- Create timeout_logs table
CREATE TABLE IF NOT EXISTS timeout_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type user_type_enum DEFAULT 'college',
    time_out TIMESTAMP
);
