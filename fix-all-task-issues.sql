-- Comprehensive fix for all task-related issues
-- Run this in Supabase SQL editor

-- First, ensure all required columns exist
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS problem_count INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_start_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 60;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Drop the existing task_type constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;

-- Add the new constraint with 'resource' included
ALTER TABLE tasks ADD CONSTRAINT tasks_task_type_check CHECK (task_type IN ('study', 'practice', 'exam', 'review', 'resource'));

-- Also ensure priority constraint exists
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high'));

-- Update existing practice tasks to have a default problem count if they don't have one
UPDATE tasks 
SET problem_count = 10 
WHERE task_type = 'practice' AND problem_count IS NULL;

-- Add comments to document the columns
COMMENT ON COLUMN tasks.problem_count IS 'Number of problems to solve (only for practice tasks)';
COMMENT ON COLUMN tasks.topic_id IS 'Optional link to specific topic within a subject';
COMMENT ON COLUMN tasks.resource_id IS 'Reference to educational resource (for resource type tasks)';
COMMENT ON COLUMN tasks.scheduled_date IS 'Date when the task is scheduled';
COMMENT ON COLUMN tasks.scheduled_start_time IS 'Optional start time for the task';
COMMENT ON COLUMN tasks.scheduled_end_time IS 'Optional end time for the task';
COMMENT ON COLUMN tasks.estimated_duration IS 'Estimated duration in minutes';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when task was completed'; 