-- Fix RLS policies to allow coaches to read their assigned students' profiles

-- Add policy for coaches to read their assigned students' profiles
CREATE POLICY "Coaches can read assigned students profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.student_id = user_profiles.id
      AND coach_student_assignments.coach_id = auth.uid()
      AND coach_student_assignments.is_active = true
    )
  );

-- Also add policy for students to read their coach profiles
CREATE POLICY "Students can read their coach profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.coach_id = user_profiles.id
      AND coach_student_assignments.student_id = auth.uid()
      AND coach_student_assignments.is_active = true
    )
  );

-- Add missing task table columns for coach interface
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 60; -- in minutes
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(20) DEFAULT 'study' CHECK (task_type IN ('study', 'practice', 'exam', 'review', 'resource'));

-- Add index for scheduled_date
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);

-- Update task policies to work with coach assignments
CREATE POLICY "Coaches can manage tasks for their students" ON tasks
  FOR ALL USING (
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.student_id = tasks.assigned_to
      AND coach_student_assignments.coach_id = auth.uid()
      AND coach_student_assignments.is_active = true
    )
  ); 