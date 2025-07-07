-- Create the mock_exams table
CREATE TABLE mock_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  difficulty_level difficulty_level DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add comments to the columns
COMMENT ON TABLE mock_exams IS 'Mock exams that can be associated with subjects/lessons';
COMMENT ON COLUMN mock_exams.name IS 'Name of the mock exam';
COMMENT ON COLUMN mock_exams.description IS 'Optional description of the mock exam';
COMMENT ON COLUMN mock_exams.subject_id IS 'Optional reference to the subject/lesson this mock exam belongs to';
COMMENT ON COLUMN mock_exams.difficulty_level IS 'Difficulty level: başlangıç, orta, ileri veya uzman';
COMMENT ON COLUMN mock_exams.is_active IS 'Whether the mock exam is active/visible';
COMMENT ON COLUMN mock_exams.created_by IS 'User who created this mock exam';

-- Create indexes for better performance
CREATE INDEX idx_mock_exams_subject_id ON mock_exams(subject_id);
CREATE INDEX idx_mock_exams_is_active ON mock_exams(is_active);
CREATE INDEX idx_mock_exams_created_by ON mock_exams(created_by);
CREATE INDEX idx_mock_exams_difficulty_level ON mock_exams(difficulty_level);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mock_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mock_exams_updated_at
  BEFORE UPDATE ON mock_exams
  FOR EACH ROW
  EXECUTE FUNCTION update_mock_exams_updated_at();

-- Add RLS policies
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all mock exams
CREATE POLICY "Admins can read all mock exams" ON mock_exams
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to insert mock exams
CREATE POLICY "Admins can insert mock exams" ON mock_exams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to update mock exams
CREATE POLICY "Admins can update mock exams" ON mock_exams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Allow admins to delete mock exams
CREATE POLICY "Admins can delete mock exams" ON mock_exams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  ); 