-- Fix with single comprehensive policy
-- Go back to working state and create one policy that handles all roles

-- Add coordinator to enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create ONE comprehensive policy that handles all cases
CREATE POLICY "user_profiles_select_policy" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Users can always read their own profile (essential for login)
        auth.uid() = id
        OR
        -- Admins can read all profiles
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
        OR
        -- Coordinators can read all profiles
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'coordinator'
        )
        OR
        -- Coaches can read their assigned students
        EXISTS (
            SELECT 1 FROM coach_student_assignments 
            WHERE coach_id = auth.uid() 
            AND student_id = user_profiles.id
            AND is_active = true
        )
        OR
        -- Students can read their assigned coach
        EXISTS (
            SELECT 1 FROM coach_student_assignments 
            WHERE student_id = auth.uid() 
            AND coach_id = user_profiles.id
            AND is_active = true
        )
    );

-- Create update policy for users to update their own profile
CREATE POLICY "user_profiles_update_policy" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Users can update their own profile
        auth.uid() = id
        OR
        -- Admins can update all profiles
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Show final policies
SELECT 'Single comprehensive policy created:' as info;
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

SELECT 'Try logging in now with single policy' as status; 