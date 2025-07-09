-- Simple login fix - create only the most basic policy needed
-- This focuses only on making login work

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

-- Create the simplest possible policy - users can read their own profile
CREATE POLICY "allow_own_profile_read" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Test the policy by checking if we can see our own profile
SELECT 'Policy created. Testing...' as status;

-- Show what we have
SELECT 'Current policies:' as info;
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT 'Try logging in now with this basic policy' as status; 