-- Add problem_count, topic_id, and resource_id columns to tasks table
-- problem_count: Number of problems to solve for practice tasks
-- topic_id: Link tasks to specific topics within subjects
-- resource_id: Link tasks to educational resources

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS problem_count INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES resources(id) ON DELETE SET NULL;

-- Add comments to document the columns
COMMENT ON COLUMN tasks.problem_count IS 'Number of problems to solve (only for practice tasks)';
COMMENT ON COLUMN tasks.topic_id IS 'Optional link to specific topic within a subject';
COMMENT ON COLUMN tasks.resource_id IS 'Reference to educational resource (for resource type tasks)';

-- Update existing practice tasks to have a default problem count
UPDATE tasks 
SET problem_count = 10 
WHERE task_type = 'practice' AND problem_count IS NULL; 