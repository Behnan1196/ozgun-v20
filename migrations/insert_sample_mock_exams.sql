-- Insert sample mock exams for testing
-- First, let's get a sample user ID (replace with actual admin user ID)
-- For now, using a placeholder that should be replaced with actual user ID

-- Insert sample mock exams
INSERT INTO mock_exams (id, name, description, subject_id, difficulty_level, is_active, created_by) 
VALUES 
  -- Mathematics mock exams
  (gen_random_uuid(), 'TYT Matematik Deneme 1', 'Temel matematik konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%matematik%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'TYT Matematik Deneme 2', 'Orta seviye matematik', 
   (SELECT id FROM subjects WHERE name ILIKE '%matematik%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'AYT Matematik Deneme 1', 'İleri matematik konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%matematik%' LIMIT 1), 
   'hard', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  -- Turkish mock exams
  (gen_random_uuid(), 'TYT Türkçe Deneme 1', 'Temel dil kuralları', 
   (SELECT id FROM subjects WHERE name ILIKE '%türkçe%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'TYT Türkçe Deneme 2', 'Paragraf ve anlam', 
   (SELECT id FROM subjects WHERE name ILIKE '%türkçe%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  -- Physics mock exams
  (gen_random_uuid(), 'TYT Fizik Deneme 1', 'Temel fizik konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%fizik%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'AYT Fizik Deneme 1', 'İleri fizik konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%fizik%' LIMIT 1), 
   'hard', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  -- Chemistry mock exams
  (gen_random_uuid(), 'TYT Kimya Deneme 1', 'Temel kimya konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%kimya%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'AYT Kimya Deneme 1', 'İleri kimya konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%kimya%' LIMIT 1), 
   'hard', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  -- Biology mock exams
  (gen_random_uuid(), 'TYT Biyoloji Deneme 1', 'Temel biyoloji konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%biyoloji%' LIMIT 1), 
   'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'AYT Biyoloji Deneme 1', 'İleri biyoloji konuları', 
   (SELECT id FROM subjects WHERE name ILIKE '%biyoloji%' LIMIT 1), 
   'hard', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  -- General mock exams (no specific subject)
  (gen_random_uuid(), 'TYT Genel Deneme 1', 'Tüm konuları içeren deneme', 
   NULL, 'medium', true, 
   (SELECT id FROM auth.users LIMIT 1)),
  
  (gen_random_uuid(), 'AYT Genel Deneme 1', 'Tüm AYT konuları', 
   NULL, 'hard', true, 
   (SELECT id FROM auth.users LIMIT 1));

-- Enable Row Level Security
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;

-- Create policies for mock_exams table
CREATE POLICY "mock_exams_select_policy" ON mock_exams
    FOR SELECT USING (true);

CREATE POLICY "mock_exams_insert_policy" ON mock_exams
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "mock_exams_update_policy" ON mock_exams
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "mock_exams_delete_policy" ON mock_exams
    FOR DELETE USING (
        auth.uid() IS NOT NULL AND
        EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    ); 