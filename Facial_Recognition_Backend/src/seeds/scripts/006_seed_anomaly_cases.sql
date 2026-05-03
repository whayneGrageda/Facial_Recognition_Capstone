-- Seed Anomaly Test Cases
-- This creates specific attendance records to test anomaly detection

-- Get a sample user for testing
DO $$
DECLARE
  test_user_id INTEGER;
  test_shs_id INTEGER;
  test_faculty_id INTEGER;
  test_date DATE := CURRENT_DATE;
BEGIN
  -- Get sample users
  SELECT id INTO test_user_id FROM users WHERE status = 'active' LIMIT 1;
  SELECT id INTO test_shs_id FROM shs_users WHERE status = 'active' LIMIT 1;
  SELECT id INTO test_faculty_id FROM faculty_users WHERE status = 'active' LIMIT 1;

  -- ABNORMAL CASE 1: Very Short Stay (1.5 hours)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_user_id, 'college', test_date + INTERVAL '8 hours', 'time-in', 'present'),
    (test_user_id, 'college', test_date + INTERVAL '9 hours 30 minutes', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- ABNORMAL CASE 2: Late Arrival (11 AM)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_shs_id, 'shs', test_date + INTERVAL '11 hours', 'time-in', 'present'),
    (test_shs_id, 'shs', test_date + INTERVAL '16 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- ABNORMAL CASE 3: Late Night Presence (8 PM)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_faculty_id, 'faculty', test_date + INTERVAL '7 hours', 'time-in', 'present'),
    (test_faculty_id, 'faculty', test_date + INTERVAL '20 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- ABNORMAL CASE 4: Multiple Entries (3 entries within 5 minutes)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_user_id + 1, 'college', test_date + INTERVAL '8 hours', 'time-in', 'present'),
    (test_user_id + 1, 'college', test_date + INTERVAL '8 hours 2 minutes', 'time-in', 'present'),
    (test_user_id + 1, 'college', test_date + INTERVAL '8 hours 4 minutes', 'time-in', 'present'),
    (test_user_id + 1, 'college', test_date + INTERVAL '15 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- ABNORMAL CASE 5: Incomplete Day (3 hours)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_shs_id + 1, 'shs', test_date + INTERVAL '8 hours', 'time-in', 'present'),
    (test_shs_id + 1, 'shs', test_date + INTERVAL '11 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- ABNORMAL CASE 6: Very Long Stay (14 hours)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_faculty_id + 1, 'faculty', test_date + INTERVAL '6 hours', 'time-in', 'present'),
    (test_faculty_id + 1, 'faculty', test_date + INTERVAL '20 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- DANGEROUS CASE 1: Midnight Access (11 PM)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_user_id + 2, 'college', test_date + INTERVAL '23 hours', 'time-in', 'present'),
    (test_user_id + 2, 'college', test_date + INTERVAL '1 day 2 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- DANGEROUS CASE 2: Extreme Duration (18 hours)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_shs_id + 2, 'shs', test_date + INTERVAL '6 hours', 'time-in', 'present'),
    (test_shs_id + 2, 'shs', test_date + INTERVAL '1 day', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  -- DANGEROUS CASE 3: Rapid Multiple Entries (3 entries in 1 minute)
  INSERT INTO attendance (user_id, user_type, timestamp, attendance_type, status)
  VALUES 
    (test_faculty_id + 2, 'faculty', test_date + INTERVAL '8 hours', 'time-in', 'present'),
    (test_faculty_id + 2, 'faculty', test_date + INTERVAL '8 hours 20 seconds', 'time-in', 'present'),
    (test_faculty_id + 2, 'faculty', test_date + INTERVAL '8 hours 40 seconds', 'time-in', 'present'),
    (test_faculty_id + 2, 'faculty', test_date + INTERVAL '15 hours', 'time-out', 'present')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Successfully created anomaly test cases';
  RAISE NOTICE '   - 6 ABNORMAL cases';
  RAISE NOTICE '   - 3 DANGEROUS cases';
END $$;
