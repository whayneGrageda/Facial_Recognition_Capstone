-- Create users table (college students)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    first_name VARCHAR,
    middle_initial VARCHAR,
    last_name VARCHAR,
    email VARCHAR UNIQUE,
    contact_number VARCHAR,
    student_id VARCHAR UNIQUE,
    password TEXT,
    course_id INTEGER REFERENCES courses(id),
    year_id INTEGER REFERENCES years(id),
    role user_role DEFAULT 'student',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    face_image_1 BYTEA,
    face_image_2 BYTEA,
    face_image_3 BYTEA,
    archived_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active',
    archived_by INTEGER REFERENCES admins(id),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by INTEGER
);

-- Create shs_users table (senior high school students)
CREATE TABLE IF NOT EXISTS shs_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    first_name VARCHAR,
    middle_initial VARCHAR,
    last_name VARCHAR,
    email VARCHAR UNIQUE,
    contact_number VARCHAR,
    student_id VARCHAR UNIQUE,
    password TEXT,
    strand_id INTEGER REFERENCES shs_strands(id),
    grade_id INTEGER REFERENCES shs_grades(id),
    role VARCHAR DEFAULT 'student',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    face_image_1 BYTEA,
    face_image_2 BYTEA,
    face_image_3 BYTEA,
    archived_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active',
    archived_by INTEGER REFERENCES admins(id),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by INTEGER
);

-- Create faculty_users table
CREATE TABLE IF NOT EXISTS faculty_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR,
    first_name VARCHAR,
    middle_initial VARCHAR,
    last_name VARCHAR,
    email VARCHAR UNIQUE,
    contact_number VARCHAR,
    password TEXT,
    face_encoding JSONB,
    role VARCHAR DEFAULT 'professor',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    department_id INTEGER REFERENCES faculty_department(id),
    face_image_1 BYTEA,
    face_image_2 BYTEA,
    face_image_3 BYTEA,
    archived_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active',
    archived_by INTEGER REFERENCES admins(id),
    deactivated_at TIMESTAMP WITH TIME ZONE,
    deactivated_by INTEGER
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    purpose VARCHAR NOT NULL,
    visit_date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'active',
    archived_by INTEGER REFERENCES admins(id),
    face_image_1 BYTEA,
    face_image_2 BYTEA,
    face_image_3 BYTEA,
    address TEXT
);
