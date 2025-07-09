-- Debug authentication to see what's happening
-- This will help us understand why login is failing

-- Show current auth state
SELECT 'Current auth.uid():' as info, auth.uid() as current_user_id;

-- Show all users in user_profiles (this will work because we're admin)
SELECT 'All users in user_profiles:' as info;
SELECT id, email, role, full_name 
FROM user_profiles 
ORDER BY created_at DESC;

-- Show current policies
SELECT 'Current policies on user_profiles:' as info;
SELECT policyname, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Test if the policy works by trying to read our own profile
-- (This simulates what happens during login)
SELECT 'Testing profile read for current user:' as info;
SELECT id, email, role, full_name 
FROM user_profiles 
WHERE id = auth.uid();

-- If that fails, let's try with a specific user ID
-- Show the first user to test with
SELECT 'First user for testing:' as info;
SELECT id, email, role 
FROM user_profiles 
LIMIT 1;

SELECT 'Debug complete - check output above' as status; 