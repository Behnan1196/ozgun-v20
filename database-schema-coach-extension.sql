-- Database Schema Extensions for Coach Interface
-- TYT AYT Coaching System V3.0
-- Date: December 25, 2024

-- ================================
-- TASK MANAGEMENT SYSTEM
-- ================================

-- Create task status enum
CREATE TYPE task_status AS ENUM (
    'assigned',
    'in_progress', 
    'completed',
    'reviewed',
    'overdue'
);

-- Create difficulty level enum  
CREATE TYPE difficulty_level AS ENUM (
    'beginner',
    'intermediate', 
    'advanced',
    'expert'
);

-- Main tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    
    -- Relationships
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Task properties
    status task_status DEFAULT 'assigned',
    difficulty difficulty_level DEFAULT 'intermediate',
    estimated_duration INTEGER, -- in minutes
    max_score INTEGER DEFAULT 100,
    
    -- Timing
    deadline TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_score CHECK (max_score > 0),
    CONSTRAINT valid_duration CHECK (estimated_duration > 0)
);

-- ================================
-- TASK SUBMISSIONS
-- ================================

CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Submission content
    submission_text TEXT,
    file_urls TEXT[], -- Array of file URLs
    
    -- Scoring
    score INTEGER,
    max_score INTEGER,
    
    -- Feedback
    feedback TEXT,
    coach_notes TEXT,
    
    -- Status
    is_submitted BOOLEAN DEFAULT FALSE,
    is_graded BOOLEAN DEFAULT FALSE,
    
    -- Timing
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_submission_score CHECK (score >= 0 AND score <= max_score),
    UNIQUE(task_id, student_id)
);

-- ================================
-- COACHING SESSIONS
-- ================================

CREATE TYPE session_type AS ENUM (
    'individual',
    'group',
    'evaluation',
    'planning'
);

CREATE TYPE session_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
    'rescheduled'
);

CREATE TABLE coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Participants
    coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    student_ids UUID[] NOT NULL, -- Array of student IDs
    
    -- Session details
    title TEXT NOT NULL,
    description TEXT,
    session_type session_type DEFAULT 'individual',
    status session_status DEFAULT 'scheduled',
    
    -- Timing
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Location/Platform
    location TEXT, -- Physical location or meeting room
    meeting_url TEXT, -- Video call URL
    
    -- Content
    agenda TEXT,
    notes TEXT,
    homework_assigned TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_session_duration CHECK (scheduled_end > scheduled_start),
    CONSTRAINT valid_student_array CHECK (array_length(student_ids, 1) > 0)
);

-- ================================
-- STUDENT PROGRESS TRACKING
-- ================================

CREATE TABLE student_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    
    -- Progress metrics
    completion_percentage INTEGER DEFAULT 0,
    average_score DECIMAL(5,2),
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    
    -- Performance indicators
    strengths TEXT[], -- Array of strength areas
    weaknesses TEXT[], -- Array of areas needing improvement
    
    -- Goals and targets
    target_score INTEGER,
    target_completion_date DATE,
    
    -- Tracking
    last_activity_date DATE,
    streak_days INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    CONSTRAINT valid_average_score CHECK (average_score >= 0 AND average_score <= 100),
    CONSTRAINT valid_task_counts CHECK (completed_tasks <= total_tasks),
    UNIQUE(student_id, subject_id, topic_id)
);

-- ================================
-- COACH NOTES & OBSERVATIONS
-- ================================

CREATE TABLE coach_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    coach_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Note content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- e.g., 'behavior', 'performance', 'goal', 'concern'
    
    -- Visibility
    is_private BOOLEAN DEFAULT TRUE, -- Private to coach vs shared with student
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Tasks indexes
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);
CREATE INDEX idx_tasks_subject_topic ON tasks(subject_id, topic_id);

-- Task submissions indexes
CREATE INDEX idx_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_submissions_student_id ON task_submissions(student_id);
CREATE INDEX idx_submissions_submitted ON task_submissions(is_submitted);

-- Coaching sessions indexes
CREATE INDEX idx_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX idx_sessions_scheduled_start ON coaching_sessions(scheduled_start);
CREATE INDEX idx_sessions_status ON coaching_sessions(status);

-- Student progress indexes
CREATE INDEX idx_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_progress_coach_id ON student_progress(coach_id);
CREATE INDEX idx_progress_subject_id ON student_progress(subject_id);

-- Coach notes indexes
CREATE INDEX idx_notes_coach_id ON coach_notes(coach_id);
CREATE INDEX idx_notes_student_id ON coach_notes(student_id);
CREATE INDEX idx_notes_created_at ON coach_notes(created_at);

-- ================================
-- ROW LEVEL SECURITY POLICIES
-- ================================

-- Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_notes ENABLE ROW LEVEL SECURITY;

-- Tasks RLS Policies
CREATE POLICY "Coaches can view tasks they assigned" ON tasks
    FOR SELECT USING (assigned_by = auth.uid());

CREATE POLICY "Students can view their assigned tasks" ON tasks
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Coaches can create tasks" ON tasks
    FOR INSERT WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Coaches can update their tasks" ON tasks
    FOR UPDATE USING (assigned_by = auth.uid());

-- Task Submissions RLS Policies
CREATE POLICY "Students can view their submissions" ON task_submissions
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Coaches can view submissions for their tasks" ON task_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks 
            WHERE tasks.id = task_submissions.task_id 
            AND tasks.assigned_by = auth.uid()
        )
    );

CREATE POLICY "Students can create/update their submissions" ON task_submissions
    FOR ALL USING (student_id = auth.uid());

-- Coaching Sessions RLS Policies
CREATE POLICY "Coaches can manage their sessions" ON coaching_sessions
    FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Students can view their sessions" ON coaching_sessions
    FOR SELECT USING (auth.uid() = ANY(student_ids));

-- Student Progress RLS Policies
CREATE POLICY "Coaches can view progress of their students" ON student_progress
    FOR SELECT USING (coach_id = auth.uid());

CREATE POLICY "Students can view their own progress" ON student_progress
    FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "Coaches can update progress of their students" ON student_progress
    FOR ALL USING (coach_id = auth.uid());

-- Coach Notes RLS Policies
CREATE POLICY "Coaches can manage their notes" ON coach_notes
    FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "Students can view non-private notes about them" ON coach_notes
    FOR SELECT USING (student_id = auth.uid() AND is_private = FALSE);

-- ================================
-- SAMPLE DATA FOR TESTING
-- ================================

-- Insert sample tasks (assuming we have test coach and student users)
INSERT INTO tasks (title, description, assigned_by, assigned_to, subject_id, status, difficulty, deadline) 
SELECT 
    'TYT Matematik - Temel Algebra Çalışması',
    'Temel algebra konularını tekrar edin ve verilen problemleri çözün.',
    (SELECT id FROM user_profiles WHERE role = 'coach' LIMIT 1),
    (SELECT id FROM user_profiles WHERE role = 'student' LIMIT 1),
    (SELECT id FROM subjects WHERE name = 'TYT Matematik' LIMIT 1),
    'assigned',
    'intermediate',
    NOW() + INTERVAL '1 week'
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE role = 'coach')
AND EXISTS (SELECT 1 FROM user_profiles WHERE role = 'student')
AND EXISTS (SELECT 1 FROM subjects WHERE name = 'TYT Matematik');

-- Insert sample coaching session
INSERT INTO coaching_sessions (
    title, 
    description, 
    coach_id, 
    student_ids, 
    session_type, 
    scheduled_start, 
    scheduled_end
) 
SELECT 
    'Matematik Birebir Ders',
    'TYT Matematik konularında birebir destek',
    (SELECT id FROM user_profiles WHERE role = 'coach' LIMIT 1),
    ARRAY[(SELECT id FROM user_profiles WHERE role = 'student' LIMIT 1)],
    'individual',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '1 hour'
WHERE EXISTS (SELECT 1 FROM user_profiles WHERE role = 'coach')
AND EXISTS (SELECT 1 FROM user_profiles WHERE role = 'student');

-- ================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ================================

-- Function to update task status
CREATE OR REPLACE FUNCTION update_task_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-update status to overdue if deadline passed
    IF NEW.deadline < NOW() AND NEW.status = 'assigned' THEN
        NEW.status = 'overdue';
    END IF;
    
    -- Update timestamps based on status changes
    IF NEW.status = 'in_progress' AND OLD.status = 'assigned' THEN
        NEW.started_at = NOW();
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = NOW();
    ELSIF NEW.status = 'reviewed' AND OLD.status != 'reviewed' THEN
        NEW.reviewed_at = NOW();
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task status updates
CREATE TRIGGER task_status_trigger
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_status();

-- Function to calculate student progress
CREATE OR REPLACE FUNCTION calculate_student_progress(
    p_student_id UUID,
    p_subject_id UUID
) RETURNS VOID AS $$
DECLARE
    total_tasks INTEGER;
    completed_tasks INTEGER;
    avg_score DECIMAL(5,2);
BEGIN
    -- Count tasks and calculate averages
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status IN ('completed', 'reviewed') THEN 1 END),
        AVG(CASE WHEN ts.score IS NOT NULL THEN ts.score ELSE NULL END)
    INTO total_tasks, completed_tasks, avg_score
    FROM tasks t
    LEFT JOIN task_submissions ts ON t.id = ts.task_id
    WHERE t.assigned_to = p_student_id 
    AND t.subject_id = p_subject_id;
    
    -- Update or insert progress record
    INSERT INTO student_progress (
        student_id, 
        subject_id, 
        total_tasks, 
        completed_tasks, 
        completion_percentage,
        average_score,
        last_activity_date
    ) VALUES (
        p_student_id,
        p_subject_id,
        total_tasks,
        completed_tasks,
        CASE WHEN total_tasks > 0 THEN (completed_tasks * 100 / total_tasks) ELSE 0 END,
        avg_score,
        CURRENT_DATE
    )
    ON CONFLICT (student_id, subject_id, topic_id) 
    DO UPDATE SET
        total_tasks = EXCLUDED.total_tasks,
        completed_tasks = EXCLUDED.completed_tasks,
        completion_percentage = EXCLUDED.completion_percentage,
        average_score = EXCLUDED.average_score,
        last_activity_date = EXCLUDED.last_activity_date,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ================================
-- VIEWS FOR COMMON QUERIES
-- ================================

-- View for coach dashboard statistics
CREATE VIEW coach_dashboard_stats AS
SELECT 
    coach.id as coach_id,
    coach.email as coach_email,
    COUNT(DISTINCT csa.student_id) as total_students,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'assigned' THEN t.id END) as pending_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
    COUNT(DISTINCT CASE WHEN t.deadline < NOW() AND t.status NOT IN ('completed', 'reviewed') THEN t.id END) as overdue_tasks,
    COUNT(DISTINCT cs.id) as total_sessions,
    COUNT(DISTINCT CASE WHEN cs.scheduled_start > NOW() THEN cs.id END) as upcoming_sessions
FROM user_profiles coach
LEFT JOIN coach_student_assignments csa ON coach.id = csa.coach_id
LEFT JOIN tasks t ON coach.id = t.assigned_by
LEFT JOIN coaching_sessions cs ON coach.id = cs.coach_id
WHERE coach.role = 'coach'
GROUP BY coach.id, coach.email;

-- View for student task summary
CREATE VIEW student_task_summary AS
SELECT 
    student.id as student_id,
    student.email as student_email,
    s.name as subject_name,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'assigned' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN t.deadline < NOW() AND t.status NOT IN ('completed', 'reviewed') THEN 1 END) as overdue_tasks,
    AVG(CASE WHEN ts.score IS NOT NULL THEN ts.score END) as average_score
FROM user_profiles student
LEFT JOIN tasks t ON student.id = t.assigned_to
LEFT JOIN subjects s ON t.subject_id = s.id
LEFT JOIN task_submissions ts ON t.id = ts.task_id AND ts.student_id = student.id
WHERE student.role = 'student'
GROUP BY student.id, student.email, s.id, s.name;

-- ================================
-- COMMENTS & DOCUMENTATION
-- ================================

COMMENT ON TABLE tasks IS 'Main table for storing educational tasks/assignments';
COMMENT ON TABLE task_submissions IS 'Student submissions and grading for tasks';
COMMENT ON TABLE coaching_sessions IS 'Scheduled coaching sessions between coaches and students';
COMMENT ON TABLE student_progress IS 'Tracking student progress across subjects and topics';
COMMENT ON TABLE coach_notes IS 'Private and shared notes from coaches about students';

COMMENT ON COLUMN tasks.difficulty IS 'Task difficulty level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN tasks.estimated_duration IS 'Estimated completion time in minutes';
COMMENT ON COLUMN tasks.max_score IS 'Maximum possible score for this task';

COMMENT ON COLUMN coaching_sessions.student_ids IS 'Array of student UUIDs participating in the session';
COMMENT ON COLUMN coaching_sessions.session_type IS 'Type of session: individual, group, evaluation, planning';

COMMENT ON COLUMN student_progress.completion_percentage IS 'Percentage of tasks completed in this subject/topic';
COMMENT ON COLUMN student_progress.streak_days IS 'Consecutive days of activity';

-- ================================
-- COMPLETION MESSAGE
-- ================================

DO $$
BEGIN
    RAISE NOTICE 'Coach interface database schema has been successfully created!';
    RAISE NOTICE 'Tables created: tasks, task_submissions, coaching_sessions, student_progress, coach_notes';
    RAISE NOTICE 'Views created: coach_dashboard_stats, student_task_summary';
    RAISE NOTICE 'RLS policies applied for security';
    RAISE NOTICE 'Sample data inserted for testing';
    RAISE NOTICE 'Ready for coach interface development!';
END $$; 