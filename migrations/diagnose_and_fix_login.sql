-- Diagnostic migration to fix login issue
-- This will show current policies and fix them

-- Add coordinator to enum if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Show current policies on user_profiles
SELECT 'Current user_profiles policies:' as info;
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Check if RLS is enabled
SELECT 'RLS status on user_profiles:' as info;
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Drop ALL existing policies on user_profiles to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', policy_record.policyname);
    END LOOP;
END $$;

-- Create the most basic policy for login - users can read their own profile
CREATE POLICY "enable_read_own_profile" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create policy for admins to read all profiles
CREATE POLICY "enable_admin_read_all" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'admin'
        )
    );

-- Create policy for coordinators to read all profiles
CREATE POLICY "enable_coordinator_read_all" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'coordinator'
        )
    );

-- Allow coaches to read their assigned students
CREATE POLICY "enable_coach_read_students" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM coach_student_assignments csa
            WHERE csa.coach_id = auth.uid() 
            AND csa.student_id = user_profiles.id
            AND csa.is_active = true
        )
    );

-- Allow students to read their assigned coach
CREATE POLICY "enable_student_read_coach" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM coach_student_assignments csa
            WHERE csa.student_id = auth.uid() 
            AND csa.coach_id = user_profiles.id
            AND csa.is_active = true
        )
    );

-- Show final policies
SELECT 'Final user_profiles policies:' as info;
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

SELECT 'Login fix applied - try logging in now' as status; 