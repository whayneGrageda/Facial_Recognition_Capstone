-- Seed Attendance Records for Monthly Graphs
-- This creates attendance data spanning 6 months for comprehensive graph visualization
-- Data includes time-in and time-out records with realistic patterns

-- Generate attendance data for the past 6 months
DO $$
DECLARE
  month_offset INTEGER;
  day_offset INTEGER;
  days_in_month INTEGER;
  hour_val INTEGER;
  minute_val INTEGER;
  user_record RECORD;
  time_in TIMESTAMP;
  time_out TIMESTAMP;
  current_month DATE;
  is_weekday BOOLEAN;
  day_of_week INTEGER;
BEGIN
  -- Loop through past 6 months
  FOR month_offset IN 0..5 LOOP
    current_month := DATE_TRUNC('month', CURRENT_DATE) - (month_offset || ' months')::INTERVAL;
    days_in_month := EXTRACT(DAY FROM (current_month + INTERVAL '1 month' - INTERVAL '1 day'));
    
    -- Loop through each day of the month
    FOR day_offset IN 0..(days_in_month - 1) LOOP
      -- Check if it's a weekday (Monday=1 to Friday=5)
      day_of_week := EXTRACT(DOW FROM (current_month + day_offset));
      is_weekday := day_of_week BETWEEN 1 AND 5;
      
      -- Only generate attendance for weekdays
      IF is_weekday THEN
        
        -- COLLEGE USERS ATTENDANCE
        FOR user_record IN SELECT id FROM users WHERE status = 'active' LOOP
          -- 75-85% attendance rate (varies by month)
          IF random() < (0.75 + (month_offset * 0.02)) THEN
            -- Time-in: Random time between 7:00 AM and 9:00 AM
            hour_val := 7 + floor(random() * 2)::INTEGER;
            minute_val := floor(random() * 60)::INTEGER;
            time_in := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
            
            INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
            VALUES (user_record.id, 'college', time_in, 'time-in', 'present')
            ON CONFLICT DO NOTHING;
            
            -- Time-out: Random time between 4:00 PM and 6:00 PM (80% chance)
            IF random() < 0.8 THEN
              hour_val := 16 + floor(random() * 2)::INTEGER;
              minute_val := floor(random() * 60)::INTEGER;
              time_out := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
              
              INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
              VALUES (user_record.id, 'college', time_out, 'time-out', 'present')
              ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        END LOOP;
        
        -- SHS USERS ATTENDANCE
        FOR user_record IN SELECT id FROM shs_users WHERE status = 'active' LOOP
          -- 80-90% attendance rate (SHS students more consistent)
          IF random() < (0.80 + (month_offset * 0.02)) THEN
            -- Time-in: Random time between 7:00 AM and 8:30 AM
            hour_val := 7 + floor(random() * 1.5)::INTEGER;
            minute_val := floor(random() * 60)::INTEGER;
            time_in := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
            
            INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
            VALUES (user_record.id, 'shs', time_in, 'time-in', 'present')
            ON CONFLICT DO NOTHING;
            
            -- Time-out: Random time between 3:00 PM and 5:00 PM (85% chance)
            IF random() < 0.85 THEN
              hour_val := 15 + floor(random() * 2)::INTEGER;
              minute_val := floor(random() * 60)::INTEGER;
              time_out := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
              
              INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
              VALUES (user_record.id, 'shs', time_out, 'time-out', 'present')
              ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        END LOOP;
        
        -- FACULTY USERS ATTENDANCE
        FOR user_record IN SELECT id FROM faculty_users WHERE status = 'active' LOOP
          -- 85-95% attendance rate (faculty most consistent)
          IF random() < (0.85 + (month_offset * 0.02)) THEN
            -- Time-in: Random time between 7:30 AM and 9:00 AM
            hour_val := 7 + floor(random() * 1.5)::INTEGER;
            minute_val := 30 + floor(random() * 30)::INTEGER;
            IF minute_val >= 60 THEN
              hour_val := hour_val + 1;
              minute_val := minute_val - 60;
            END IF;
            time_in := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
            
            INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
            VALUES (user_record.id, 'faculty', time_in, 'time-in', 'present')
            ON CONFLICT DO NOTHING;
            
            -- Time-out: Random time between 5:00 PM and 7:00 PM (90% chance)
            IF random() < 0.9 THEN
              hour_val := 17 + floor(random() * 2)::INTEGER;
              minute_val := floor(random() * 60)::INTEGER;
              time_out := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
              
              INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
              VALUES (user_record.id, 'faculty', time_out, 'time-out', 'present')
              ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        END LOOP;
        
        -- GUEST ATTENDANCE (less frequent, random days)
        FOR user_record IN SELECT id FROM guests WHERE status = 'active' LOOP
          -- 15-25% attendance rate (guests visit occasionally)
          IF random() < (0.15 + (month_offset * 0.02)) THEN
            -- Time-in: Random time between 8:00 AM and 11:00 AM
            hour_val := 8 + floor(random() * 3)::INTEGER;
            minute_val := floor(random() * 60)::INTEGER;
            time_in := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
            
            INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
            VALUES (user_record.id, 'guest', time_in, 'time-in', 'present')
            ON CONFLICT DO NOTHING;
            
            -- Time-out: Random time between 2:00 PM and 4:00 PM (70% chance)
            IF random() < 0.7 THEN
              hour_val := 14 + floor(random() * 2)::INTEGER;
              minute_val := floor(random() * 60)::INTEGER;
              time_out := (current_month + day_offset) + (hour_val || ' hours ' || minute_val || ' minutes')::INTERVAL;
              
              INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
              VALUES (user_record.id, 'guest', time_out, 'time-out', 'present')
              ON CONFLICT DO NOTHING;
            END IF;
          END IF;
        END LOOP;
        
      END IF; -- End weekday check
    END LOOP; -- End day loop
  END LOOP; -- End month loop
  
  RAISE NOTICE '✅ Successfully generated 6 months of attendance data for monthly graphs';
END $$;

-- Display summary statistics
DO $$
DECLARE
  total_records INTEGER;
  college_count INTEGER;
  shs_count INTEGER;
  faculty_count INTEGER;
  guest_count INTEGER;
  months_covered INTEGER;
  oldest_date DATE;
  newest_date DATE;
BEGIN
  SELECT COUNT(*) INTO total_records FROM attendance;
  SELECT COUNT(*) INTO college_count FROM attendance WHERE user_type = 'college';
  SELECT COUNT(*) INTO shs_count FROM attendance WHERE user_type = 'shs';
  SELECT COUNT(*) INTO faculty_count FROM attendance WHERE user_type = 'faculty';
  SELECT COUNT(*) INTO guest_count FROM attendance WHERE user_type = 'guest';
  
  SELECT COUNT(DISTINCT DATE_TRUNC('month', timestamp)) INTO months_covered FROM attendance;
  SELECT DATE(MIN(timestamp)) INTO oldest_date FROM attendance;
  SELECT DATE(MAX(timestamp)) INTO newest_date FROM attendance;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 ATTENDANCE DATA SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total Records: %', total_records;
  RAISE NOTICE 'College: %', college_count;
  RAISE NOTICE 'SHS: %', shs_count;
  RAISE NOTICE 'Faculty: %', faculty_count;
  RAISE NOTICE 'Guest: %', guest_count;
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Months Covered: %', months_covered;
  RAISE NOTICE 'Date Range: % to %', oldest_date, newest_date;
  RAISE NOTICE '========================================';
END $$;
