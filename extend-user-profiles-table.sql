-- Extend user_profiles table with additional student information fields
-- Add new columns to user_profiles table

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),  -- Bölüm (Sayısal, Eşit Ağırlık, etc.)
ADD COLUMN IF NOT EXISTS school VARCHAR(255),      -- Okul
ADD COLUMN IF NOT EXISTS tutoring_center VARCHAR(255), -- Dershane
ADD COLUMN IF NOT EXISTS target_university VARCHAR(255), -- Hedef Üniversite
ADD COLUMN IF NOT EXISTS target_department VARCHAR(255), -- Hedef Bölüm
ADD COLUMN IF NOT EXISTS yks_score INTEGER,        -- YKS Puanı
ADD COLUMN IF NOT EXISTS start_date DATE,          -- Başlama Tarihi
ADD COLUMN IF NOT EXISTS parent_name VARCHAR(255), -- Veli Adı
ADD COLUMN IF NOT EXISTS parent_phone VARCHAR(20), -- Veli Telefonu
ADD COLUMN IF NOT EXISTS address TEXT,             -- Adres
ADD COLUMN IF NOT EXISTS notes TEXT;               -- Notlar

-- Add index for better performance on commonly searched fields
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