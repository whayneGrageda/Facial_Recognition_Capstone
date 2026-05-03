-- Create base metadata tables
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS years (
    id SERIAL PRIMARY KEY,
    year_name VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS shs_strands (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    acronym VARCHAR
);

CREATE TABLE IF NOT EXISTS shs_grades (
    id SERIAL PRIMARY KEY,
    grade_name VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_department (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR NOT NULL
);
