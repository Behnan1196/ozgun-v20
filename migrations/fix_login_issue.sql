-- Quick fix for login issue - ensure users can read their own profile
-- This fixes the "Kullanıcı profili bulunamadı" error

-- First, add coordinator to enum if not exists
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Ensure users can always read their own profile (critical for login)
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins and coordinators to read all profiles (separate policy)
DROP POLICY IF EXISTS "Admins and coordinators can read all profiles" ON user_profiles;
CREATE POLICY "Admins and coordinators can read all profiles" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'coordinator')
    )
  );

-- Ensure coaches can read student profiles they're assigned to
DROP POLICY IF EXISTS "Coaches can read assigned student profiles" ON user_profiles;
CREATE POLICY "Coaches can read assigned student profiles" ON user_profiles
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

-- Allow students to read their coach's profile
DROP POLICY IF EXISTS "Students can read their coach profile" ON user_profiles;
CREATE POLICY "Students can read their coach profile" ON user_profiles
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

SELECT 'Login issue fixed - users can now read their own profiles' as status; 