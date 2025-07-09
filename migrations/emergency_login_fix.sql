-- Emergency login fix - temporarily disable RLS to diagnose issue
-- This will help us understand what's causing the login problem

-- Add coordinator to enum if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Show current user count and roles
SELECT 'Current users in user_profiles:' as info;
SELECT id, email, role, full_name, created_at 
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if RLS is enabled
SELECT 'RLS status:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Check current policies
SELECT 'Current policies:' as info;
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- TEMPORARILY disable RLS for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

SELECT 'RLS TEMPORARILY DISABLED - try logging in now' as status;
SELECT 'After testing, run the next migration to re-enable RLS' as warning; 