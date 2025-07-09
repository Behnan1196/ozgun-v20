-- Add coordinator role support to existing RLS policies
-- This migration adds coordinator permissions to all relevant tables

-- First, add 'coordinator' to the user_role enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordinator';

-- Update tasks policies to include coordinator access
DROP POLICY IF EXISTS "Students can subscribe to their own tasks" ON tasks;
DROP POLICY IF EXISTS "Coaches can subscribe to tasks they assigned" ON tasks;

-- Recreate tasks policies with coordinator access
CREATE POLICY "Students can subscribe to their own tasks" 
ON tasks FOR SELECT 
TO authenticated 
USING (
  auth.uid() = assigned_to OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('coach', 'admin', 'coordinator')
  )
);

CREATE POLICY "Coaches can subscribe to tasks they assigned" 
ON tasks FOR ALL 
TO authenticated 
USING (
  auth.uid() = assigned_by OR 
  auth.uid() = assigned_to OR
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coordinator')
  )
);

-- Update user_profiles policies to include coordinator access
-- First, ensure users can read their own profile (essential for login)
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;
CREATE POLICY "Users can read their own profile" ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow admins and coordinators to read all profiles
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

-- Update coach_student_assignments policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'coach_student_assignments' 
    AND policyname = 'Coordinators can read all assignments'
  ) THEN
    CREATE POLICY "Coordinators can read all assignments" ON coach_student_assignments
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = coach_id OR
        auth.uid() = student_id OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator')
        )
      );
  END IF;
END $$;

-- Update subjects policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'subjects' 
    AND policyname = 'Coordinators can read all subjects'
  ) THEN
    CREATE POLICY "Coordinators can read all subjects" ON subjects
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator', 'coach', 'student')
        )
      );
  END IF;
END $$;

-- Update topics policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'topics' 
    AND policyname = 'Coordinators can read all topics'
  ) THEN
    CREATE POLICY "Coordinators can read all topics" ON topics
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator', 'coach', 'student')
        )
      );
  END IF;
END $$;

-- Update mock_exams policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mock_exams' 
    AND policyname = 'Coordinators can read all mock exams'
  ) THEN
    CREATE POLICY "Coordinators can read all mock exams" ON mock_exams
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator', 'coach', 'student')
        )
      );
  END IF;
END $$;

-- Update resources policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'resources' 
    AND policyname = 'Coordinators can read all resources'
  ) THEN
    CREATE POLICY "Coordinators can read all resources" ON resources
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator', 'coach', 'student')
        )
      );
  END IF;
END $$;

-- Update student_goals policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'student_goals' 
    AND policyname = 'Coordinators can read all student goals'
  ) THEN
    CREATE POLICY "Coordinators can read all student goals" ON student_goals
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = student_id OR
        auth.uid() = coach_id OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator')
        )
      );
  END IF;
END $$;

-- Update mock_exam_results policies to include coordinator access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mock_exam_results' 
    AND policyname = 'Coordinators can read all mock exam results'
  ) THEN
    CREATE POLICY "Coordinators can read all mock exam results" ON mock_exam_results
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = student_id OR
        auth.uid() = coach_id OR
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'coordinator')
        )
      );
  END IF;
END $$;

-- Allow coordinators to create/update/delete tasks for any student
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'tasks' 
    AND policyname = 'Coordinators can manage all tasks'
  ) THEN
    CREATE POLICY "Coordinators can manage all tasks" ON tasks
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role = 'coordinator'
        )
      );
  END IF;
END $$;

-- Allow coordinators to create/update/delete student goals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'student_goals' 
    AND policyname = 'Coordinators can manage all student goals'
  ) THEN
    CREATE POLICY "Coordinators can manage all student goals" ON student_goals
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role = 'coordinator'
        )
      );
  END IF;
END $$;

-- Allow coordinators to create/update/delete mock exam results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mock_exam_results' 
    AND policyname = 'Coordinators can manage all mock exam results'
  ) THEN
    CREATE POLICY "Coordinators can manage all mock exam results" ON mock_exam_results
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE id = auth.uid() 
          AND role = 'coordinator'
        )
      );
  END IF;
END $$;

-- Verify policies have been created
SELECT 'Coordinator policies added successfully' as status;
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND policyname LIKE '%coordinator%' 
ORDER BY tablename, policyname; 