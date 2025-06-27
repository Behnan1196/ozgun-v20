-- TYT AYT Coaching System V3.0 Database Schema
-- Clean schema for Supabase hosted database

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'student');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE resource_category AS ENUM ('video', 'document', 'pdf', 'application');

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
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(coach_id, student_id)
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(255) NOT NULL,
  category resource_category NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES user_profiles(id),
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  status task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stream_tokens table
CREATE TABLE IF NOT EXISTS stream_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_tokens ENABLE ROW LEVEL SECURITY;

-- User profiles policies (SIMPLIFIED to avoid recursion)
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin policies (using auth.jwt() to avoid profile lookups)
CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'admin@example.com'
  );

CREATE POLICY "Admins can manage all assignments" ON coach_student_assignments
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

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

CREATE POLICY "Admins can manage stream tokens" ON stream_tokens
  FOR ALL USING ((auth.jwt() ->> 'email') = 'admin@example.com');

-- Coach-Student assignments policies
CREATE POLICY "Coaches can read their assignments" ON coach_student_assignments
  FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Students can read their assignments" ON coach_student_assignments
  FOR SELECT USING (student_id = auth.uid());

-- Public read policies for subjects and topics
CREATE POLICY "Everyone can read subjects" ON subjects 
  FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can read topics" ON topics 
  FOR SELECT USING (is_active = true);

-- Resources policies
CREATE POLICY "Everyone can read active resources" ON resources
  FOR SELECT USING (is_active = true);

CREATE POLICY "Coaches and admins can manage resources" ON resources
  FOR ALL USING (
    (auth.jwt() ->> 'email') = 'admin@example.com' OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'coach')
    )
  );

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

-- Stream tokens policies
CREATE POLICY "Users can manage their own stream tokens" ON stream_tokens
  FOR ALL USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_coach_student_assignments_coach ON coach_student_assignments(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_student_assignments_student ON coach_student_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at 
  BEFORE UPDATE ON subjects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at 
  BEFORE UPDATE ON resources 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON announcements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 