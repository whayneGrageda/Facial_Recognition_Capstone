-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR,
    password TEXT,
    role VARCHAR DEFAULT 'admin'
);

-- Create moderators table
CREATE TABLE IF NOT EXISTS moderators (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    email VARCHAR,
    password TEXT,
    role VARCHAR DEFAULT 'moderator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active',
    archived_by INTEGER REFERENCES admins(id)
);
