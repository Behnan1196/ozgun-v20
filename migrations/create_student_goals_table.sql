-- Create student_goals table for goal tracking
CREATE TABLE IF NOT EXISTS student_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('tyt_target', 'ayt_target', 'university_target', 'department_target', 'study_hours', 'custom')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_value TEXT,
  current_value TEXT,
  target_date DATE,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON student_goals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_coach_id ON student_goals(coach_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_goal_type ON student_goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_student_goals_status ON student_goals(status);
CREATE INDEX IF NOT EXISTS idx_student_goals_is_active ON student_goals(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_student_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_goals_updated_at
  BEFORE UPDATE ON student_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_student_goals_updated_at();

-- Enable RLS
ALTER TABLE student_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for student_goals
CREATE POLICY "Students can view their own goals" ON student_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view their assigned student goals" ON student_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Admins can view all student goals" ON student_goals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Coaches can create goals for their assigned students" ON student_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_student_assignments 
      WHERE coach_id = auth.uid() 
      AND student_id = student_goals.student_id 
      AND is_active = true
    )
  );

CREATE POLICY "Coaches can update goals for their assigned students" ON student_goals
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_student_assignments 
      WHERE coach_id = auth.uid() 
      AND student_id = student_goals.student_id 
      AND is_active = true
    )
  );

CREATE POLICY "Coaches can delete goals for their assigned students" ON student_goals
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_student_assignments 
      WHERE coach_id = auth.uid() 
      AND student_id = student_goals.student_id 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage all student goals" ON student_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  ); 