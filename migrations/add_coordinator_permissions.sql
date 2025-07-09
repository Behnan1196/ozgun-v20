-- Add coordinator permissions - building on the working login policy
-- This adds coordinator access without breaking existing login

-- Add coordinator role to enum (safe to run multiple times)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Add policy for users to update their own profile
CREATE POLICY "allow_own_profile_update" ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Add policy for admins to read all profiles
CREATE POLICY "allow_admin_read_all" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add policy for coordinators to read all profiles
CREATE POLICY "allow_coordinator_read_all" ON user_profiles
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'coordinator'
        )
    );

-- Add policy for coaches to read their assigned students
CREATE POLICY "allow_coach_read_students" ON user_profiles
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

-- Add policy for students to read their assigned coach
CREATE POLICY "allow_student_read_coach" ON user_profiles
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
SELECT 'Coordinator permissions added:' as info;
SELECT policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

SELECT 'Coordinator role is now fully functional!' as status; 