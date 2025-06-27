-- TYT AYT Coaching System Database Schema V3
-- This schema creates all necessary tables, policies, and triggers for the coaching system

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'student');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coach_student_assignments table
CREATE TABLE IF NOT EXISTS coach_student_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, student_id)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  resource_type VARCHAR(50),
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id),
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES user_profiles(id),
  status task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Admin policies (using auth.jwt() to avoid profile lookups)
CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'admin@example.com'
  );

CREATE POLICY "Admins can manage all assignments" ON coach_student_assignments
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

-- Admin can manage subjects and topics
CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

CREATE POLICY "Admins can manage topics" ON topics
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

CREATE POLICY "Admins can manage all resources" ON resources
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

CREATE POLICY "Admins can manage all tasks" ON tasks
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

CREATE POLICY "Admins can manage announcements" ON announcements
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

-- User policies (users can view their own profile)
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Coach policies
CREATE POLICY "Coaches can view their assignments" ON coach_student_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'coach'
      AND user_profiles.id = coach_student_assignments.coach_id
    )
  );

CREATE POLICY "Coaches can view assigned students" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.student_id = user_profiles.id
      AND coach_student_assignments.coach_id = auth.uid()
    )
  );

-- Student policies
CREATE POLICY "Students can view their coach" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.coach_id = user_profiles.id
      AND coach_student_assignments.student_id = auth.uid()
    )
  );

-- Everyone can view subjects and topics
CREATE POLICY "Everyone can view subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Everyone can view topics" ON topics FOR SELECT USING (true);

-- Everyone can view resources
CREATE POLICY "Everyone can view resources" ON resources FOR SELECT USING (true);

-- Task policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Coaches can view tasks for their students" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.student_id = tasks.assigned_to
      AND coach_student_assignments.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create tasks for their students" ON tasks
  FOR INSERT WITH CHECK (
    assigned_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM coach_student_assignments
      WHERE coach_student_assignments.student_id = tasks.assigned_to
      AND coach_student_assignments.coach_id = auth.uid()
    )
  );

-- Announcement policies
CREATE POLICY "Everyone can view active announcements" ON announcements
  FOR SELECT USING (is_active = true);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_coach_student_assignments_coach ON coach_student_assignments(coach_id);
CREATE INDEX idx_coach_student_assignments_student ON coach_student_assignments(student_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_announcements_active ON announcements(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subjects for TYT AYT system
INSERT INTO subjects (name, description) VALUES
  ('Türkçe', 'Turkish Language and Literature'),
  ('Matematik', 'Mathematics'),
  ('Geometri', 'Geometry'),
  ('Fizik', 'Physics'),
  ('Kimya', 'Chemistry'),
  ('Biyoloji', 'Biology'),
  ('Tarih', 'History'),
  ('Coğrafya', 'Geography'),
  ('Felsefe', 'Philosophy'),
  ('Din Kültürü', 'Religious Culture')
ON CONFLICT DO NOTHING; 