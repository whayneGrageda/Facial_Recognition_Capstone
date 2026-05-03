-- Seed Attendance Records for the past 30 days
-- This creates realistic attendance data for testing and demo purposes

-- College Users Attendance (Past 30 days)
DO $$
DECLARE
  day_offset INTEGER;
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  attendance_time TIMESTAMP;
BEGIN
  -- Loop through past 30 days
  FOR day_offset IN 0..29 LOOP
    -- Loop through college users (randomly attend 70-90% of days)
    FOR user_record IN SELECT id, student_id FROM users WHERE status = 'active' LOOP
      -- 80% chance of attendance each day
      IF random() < 0.8 THEN
        -- Random time between 7 AM and 5 PM
        hour_val := 7 + floor(random() * 10)::INTEGER;
        minute_val := floor(random() * 60)::INTEGER;
        attendance_time := (CURRENT_DATE - day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
        
        INSERT INTO attendance (user_id, user_type, timestamp, status)
        VALUES (user_record.id, 'college', attendance_time, 'present')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- SHS Users Attendance (Past 30 days)
DO $$
DECLARE
  day_offset INTEGER;
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  attendance_time TIMESTAMP;
BEGIN
  FOR day_offset IN 0..29 LOOP
    FOR user_record IN SELECT id, student_id FROM shs_users WHERE status = 'active' LOOP
      -- 85% chance of attendance each day
      IF random() < 0.85 THEN
        hour_val := 7 + floor(random() * 10)::INTEGER;
        minute_val := floor(random() * 60)::INTEGER;
        attendance_time := (CURRENT_DATE - day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
        
        INSERT INTO attendance (user_id, user_type, timestamp, status)
        VALUES (user_record.id, 'shs', attendance_time, 'present')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Faculty Users Attendance (Past 30 days)
DO $$
DECLARE
  day_offset INTEGER;
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  attendance_time TIMESTAMP;
BEGIN
  FOR day_offset IN 0..29 LOOP
    FOR user_record IN SELECT id FROM faculty_users WHERE status = 'active' LOOP
      -- 90% chance of attendance each day (faculty more consistent)
      IF random() < 0.9 THEN
        hour_val := 7 + floor(random() * 10)::INTEGER;
        minute_val := floor(random() * 60)::INTEGER;
        attendance_time := (CURRENT_DATE - day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
        
        INSERT INTO attendance (user_id, user_type, timestamp, status)
        VALUES (user_record.id, 'faculty', attendance_time, 'present')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Guest Attendance (Past 30 days, less frequent)
DO $$
DECLARE
  day_offset INTEGER;
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  attendance_time TIMESTAMP;
BEGIN
  FOR day_offset IN 0..29 LOOP
    FOR user_record IN SELECT id FROM guests WHERE status = 'active' LOOP
      -- 30% chance of attendance each day (guests visit occasionally)
      IF random() < 0.3 THEN
        hour_val := 8 + floor(random() * 8)::INTEGER;
        minute_val := floor(random() * 60)::INTEGER;
        attendance_time := (CURRENT_DATE - day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
        
        INSERT INTO attendance (user_id, user_type, timestamp, status)
        VALUES (user_record.id, 'guest', attendance_time, 'present')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Add some attendance for TODAY to show in "Present Today" stat
DO $$
DECLARE
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  attendance_time TIMESTAMP;
BEGIN
  -- College users today
  FOR user_record IN SELECT id FROM users WHERE status = 'active' LIMIT 10 LOOP
    hour_val := 7 + floor(random() * 3)::INTEGER;
    minute_val := floor(random() * 60)::INTEGER;
    attendance_time := CURRENT_DATE + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
    
    INSERT INTO attendance (user_id, user_type, timestamp, status)
    VALUES (user_record.id, 'college', attendance_time, 'present')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- SHS users today
  FOR user_record IN SELECT id FROM shs_users WHERE status = 'active' LIMIT 8 LOOP
    hour_val := 7 + floor(random() * 3)::INTEGER;
    minute_val := floor(random() * 60)::INTEGER;
    attendance_time := CURRENT_DATE + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
    
    INSERT INTO attendance (user_id, user_type, timestamp, status)
    VALUES (user_record.id, 'shs', attendance_time, 'present')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Faculty users today
  FOR user_record IN SELECT id FROM faculty_users WHERE status = 'active' LIMIT 7 LOOP
    hour_val := 7 + floor(random() * 3)::INTEGER;
    minute_val := floor(random() * 60)::INTEGER;
    attendance_time := CURRENT_DATE + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
    
    INSERT INTO attendance (user_id, user_type, timestamp, status)
    VALUES (user_record.id, 'faculty', attendance_time, 'present')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
