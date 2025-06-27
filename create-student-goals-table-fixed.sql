-- Create student_goals table for storing editable student goals (CORRECTED VERSION)
CREATE TABLE IF NOT EXISTS student_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
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
  created_by UUID REFERENCES user_profiles(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON student_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_coach_id ON student_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_goal_type ON student_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_student_goals_status ON student_goals(status);

-- Enable RLS
ALTER TABLE student_goals ENABLE ROW LEVEL SECURITY;

-- Admin policies (using auth.jwt() to avoid profile lookups)
CREATE POLICY "Admins can manage all goals" ON student_goals
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'admin@example.com'
  );

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
  )
);

-- Coaches can insert goals for their assigned students
CREATE POLICY "Coaches can create goals for assigned students" ON student_goals
FOR INSERT WITH CHECK (
  coach_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
  )
);

-- Coaches can update goals for their assigned students
CREATE POLICY "Coaches can update goals for assigned students" ON student_goals
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
  )
);

-- Coaches can delete goals for their assigned students
CREATE POLICY "Coaches can delete goals for assigned students" ON student_goals
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM coach_student_assignments
    WHERE coach_student_assignments.student_id = student_goals.student_id
    AND coach_student_assignments.coach_id = auth.uid()
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_student_goals_updated_at 
    BEFORE UPDATE ON student_goals 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 