-- Re-enable RLS with proper policies after testing
-- Run this AFTER testing login with RLS disabled

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "enable_read_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "enable_admin_read_all" ON user_profiles;
DROP POLICY IF EXISTS "enable_coordinator_read_all" ON user_profiles;
DROP POLICY IF EXISTS "enable_coach_read_students" ON user_profiles;
DROP POLICY IF EXISTS "enable_student_read_coach" ON user_profiles;

-- Create the most basic policy - users can read their own profile
CREATE POLICY "users_read_own_profile" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_update_own_profile" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Allow admins to read and modify all profiles
CREATE POLICY "admins_manage_all_profiles" ON user_profiles
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Allow coordinators to read all profiles
CREATE POLICY "coordinators_read_all_profiles" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'coordinator'
        )
    );

-- Allow coaches to read their assigned students
CREATE POLICY "coaches_read_assigned_students" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM coach_student_assignments 
            WHERE coach_id = auth.uid() 
            AND student_id = user_profiles.id
            AND is_active = true
        )
    );

-- Allow students to read their assigned coach
CREATE POLICY "students_read_assigned_coach" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM coach_student_assignments 
            WHERE student_id = auth.uid() 
            AND coach_id = user_profiles.id
            AND is_active = true
        )
    );

-- Show final policies
SELECT 'RLS re-enabled with proper policies:' as info;
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

SELECT 'RLS re-enabled - login should work now' as status; 