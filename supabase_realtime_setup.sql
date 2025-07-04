-- Enable real-time for the tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Check if real-time is enabled (this should show the tasks table)
SELECT schemaname, tablename, attname, type, settings 
FROM pg_publication_tables pt
JOIN pg_publication p ON pt.pubname = p.pubname
WHERE p.pubname = 'supabase_realtime';

-- Ensure RLS policies allow real-time subscriptions
-- Students should be able to subscribe to their own tasks
CREATE POLICY IF NOT EXISTS "Students can subscribe to their own tasks" 
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

-- Coaches should be able to subscribe to tasks they assigned
CREATE POLICY IF NOT EXISTS "Coaches can subscribe to tasks they assigned" 
ON tasks FOR SELECT 
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

-- Enable real-time for coach-student assignments (for better user management)
ALTER PUBLICATION supabase_realtime ADD TABLE coach_student_assignments;

-- Enable real-time for user profiles (for user status updates)
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles; 