-- First, extend the user_profiles table with new fields
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS school VARCHAR(255),
ADD COLUMN IF NOT EXISTS tutoring_center VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_university VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_department VARCHAR(255),
ADD COLUMN IF NOT EXISTS yks_score INTEGER,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_department ON user_profiles(department);
CREATE INDEX IF NOT EXISTS idx_user_profiles_school ON user_profiles(school);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- Add policy for coaches to update their assigned students' profiles
-- Drop the policy if it exists, then create it
DROP POLICY IF EXISTS "Coaches can update assigned students profiles" ON user_profiles;
CREATE POLICY "Coaches can update assigned students profiles" ON user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = user_profiles.id
    AND coach_student_assignments.coach_id = auth.uid()
  )
);

-- Populate sample data for students (update existing students with profile info)
-- Update students that don't have profile data yet
UPDATE user_profiles 
SET 
  phone = '5551234567',
  department = 'Sayısal',
  school = 'Ankara Anadolu Lisesi',
  tutoring_center = 'Özgün Fen Merkezi',
  target_university = 'Harran Üniversitesi',
  target_department = 'Diş Hekimliği',
  yks_score = 485,
  start_date = '2025-03-18',
  parent_name = 'Mahmut Tamer',
  parent_phone = '5559876543',
  address = 'Çankaya, Ankara',
  notes = 'Matematik konusunda güçlü, fizik çalışması gerekiyor.',
  updated_at = NOW()
WHERE role = 'student' 
AND phone IS NULL
AND id = (
  SELECT id FROM user_profiles 
  WHERE role = 'student' AND phone IS NULL 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Add more sample data for a different student
UPDATE user_profiles 
SET 
  phone = '5552345678',
  department = 'Eşit Ağırlık',
  school = 'İstanbul Fen Lisesi',
  tutoring_center = 'Başarı Eğitim Merkezi',
  target_university = 'Boğaziçi Üniversitesi',
  target_department = 'İktisat',
  yks_score = 520,
  start_date = '2025-02-15',
  parent_name = 'Ayşe Demir',
  parent_phone = '5558765432',
  address = 'Beşiktaş, İstanbul',
  notes = 'Sosyal bilimler alanında başarılı, matematik desteğe ihtiyacı var.',
  updated_at = NOW()
WHERE role = 'student' 
AND phone IS NULL
AND id = (
  SELECT id FROM user_profiles 
  WHERE role = 'student' AND phone IS NULL 
  ORDER BY created_at DESC 
  LIMIT 1
); 