-- Create student_goals table for storing editable student goals
CREATE TABLE IF NOT EXISTS student_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('tyt_target', 'ayt_target', 'university_target', 'department_target', 'study_hours', 'custom')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value VARCHAR(255), -- For numeric goals like scores, hours etc.
  current_value VARCHAR(255), -- Current progress
  target_date DATE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON student_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_coach_id ON student_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_goal_type ON student_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_student_goals_status ON student_goals(status);

-- Enable RLS
ALTER TABLE student_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can read their own goals
CREATE POLICY "Students can read own goals" ON student_goals
FOR SELECT USING (student_id = auth.uid());

-- Coaches can read goals of their assigned students
CREATE POLICY "Coaches can read assigned students goals" ON student_goals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
    AND coach_student_assignments.is_active = true
  )
);

-- Coaches can insert goals for their assigned students
CREATE POLICY "Coaches can create goals for assigned students" ON student_goals
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
    AND coach_student_assignments.is_active = true
  )
);

-- Coaches can update goals for their assigned students
CREATE POLICY "Coaches can update goals for assigned students" ON student_goals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
    AND coach_student_assignments.is_active = true
  )
);

-- Coaches can delete goals for their assigned students
CREATE POLICY "Coaches can delete goals for assigned students" ON student_goals
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
    AND coach_student_assignments.is_active = true
  )
);

-- Insert sample goals for testing
INSERT INTO student_goals (student_id, coach_id, goal_type, title, description, target_value, current_value, target_date, priority, created_by)
VALUES 
  -- Sample goals (replace with actual student and coach IDs)
  ((SELECT id FROM auth.users WHERE email LIKE '%student%' LIMIT 1), 
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1), 
   'tyt_target', 'TYT Hedef Puanı', 'TYT sınavından hedeflenen puan', '450', '320', '2024-06-15', 'high',
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1)),
   
  ((SELECT id FROM auth.users WHERE email LIKE '%student%' LIMIT 1), 
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1), 
   'ayt_target', 'AYT Hedef Puanı', 'AYT sınavından hedeflenen puan', '380', '280', '2024-06-16', 'high',
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1)),
   
  ((SELECT id FROM auth.users WHERE email LIKE '%student%' LIMIT 1), 
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1), 
   'university_target', 'Hedef Üniversite', 'Girmek istediği üniversite', 'İstanbul Teknik Üniversitesi', '', '2024-08-01', 'high',
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1)),
   
  ((SELECT id FROM auth.users WHERE email LIKE '%student%' LIMIT 1), 
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1), 
   'study_hours', 'Haftalık Çalışma Saati', 'Haftada hedeflenen çalışma saati', '40', '25', '2024-12-31', 'medium',
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1)),
   
  ((SELECT id FROM auth.users WHERE email LIKE '%student%' LIMIT 1), 
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1), 
   'custom', 'Matematik Konularını Bitirme', 'AYT matematik konularının tamamını bitirme', '100%', '65%', '2024-05-01', 'medium',
   (SELECT id FROM auth.users WHERE email LIKE '%coach%' LIMIT 1));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_goals_updated_at 
    BEFORE UPDATE ON student_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 