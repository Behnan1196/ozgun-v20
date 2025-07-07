-- Enable real-time for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Check if real-time is enabled (this should show the tasks table)
SELECT schemaname, tablename 
FROM pg_publication_tables pt
JOIN pg_publication p ON pt.pubname = p.pubname
WHERE p.pubname = 'supabase_realtime';

-- Drop existing policies if they exist and recreate them
-- (This avoids the IF NOT EXISTS syntax issue)
DROP POLICY IF EXISTS "Students can subscribe to their own tasks" ON tasks;
DROP POLICY IF EXISTS "Coaches can subscribe to tasks they assigned" ON tasks;

-- Create policies for real-time subscriptions
CREATE POLICY "Students can subscribe to their own tasks" 
ON tasks FOR SELECT 
TO authenticated 
USING (
  auth.uid() = assigned_to OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('coach', 'admin')
  )
);

CREATE POLICY "Coaches can subscribe to tasks they assigned" 
ON tasks FOR ALL 
TO authenticated 
USING (
  auth.uid() = assigned_by OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin')
  )
);

-- Enable real-time for related tables (optional)
ALTER PUBLICATION supabase_realtime ADD TABLE coach_student_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;

-- Verify real-time is enabled
SELECT 'Real-time enabled for:' as status;
SELECT schemaname, tablename 
FROM pg_publication_tables pt
JOIN pg_publication p ON pt.pubname = p.pubname
WHERE p.pubname = 'supabase_realtime' 
AND tablename IN ('tasks', 'coach_student_assignments', 'user_profiles'); 