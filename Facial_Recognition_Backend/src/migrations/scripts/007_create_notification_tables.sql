-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_type VARCHAR NOT NULL DEFAULT 'college'
);

-- Create user_devices table for FCM tokens
CREATE TABLE IF NOT EXISTS user_devices (
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_token VARCHAR NOT NULL,
    platform VARCHAR NOT NULL DEFAULT 'android',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, platform)
);
