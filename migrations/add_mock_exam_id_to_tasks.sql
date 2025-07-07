-- Add mock_exam_id column to tasks table
ALTER TABLE tasks ADD COLUMN mock_exam_id UUID REFERENCES mock_exams(id) ON DELETE SET NULL;

-- Add comment to the new column
COMMENT ON COLUMN tasks.mock_exam_id IS 'Optional reference to a mock exam for exam-type tasks';

-- Create index for better performance
CREATE INDEX idx_tasks_mock_exam_id ON tasks(mock_exam_id); 