-- Mock Exam Results Table
-- This table stores TYT and AYT mock exam results for students

CREATE TABLE mock_exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Exam Information
  exam_type VARCHAR(10) NOT NULL CHECK (exam_type IN ('TYT', 'AYT')),
  exam_date DATE NOT NULL,
  exam_name VARCHAR(255) NOT NULL, -- e.g., "1. Deneme Sınavı", "Final Denemesi"
  exam_duration INTEGER, -- in minutes
  
  -- TYT Subject Scores (40 questions each for Türkçe, 36 for others)
  tyt_turkce_correct INTEGER DEFAULT 0 CHECK (tyt_turkce_correct >= 0 AND tyt_turkce_correct <= 40),
  tyt_turkce_wrong INTEGER DEFAULT 0 CHECK (tyt_turkce_wrong >= 0 AND tyt_turkce_wrong <= 40),
  tyt_matematik_correct INTEGER DEFAULT 0 CHECK (tyt_matematik_correct >= 0 AND tyt_matematik_correct <= 36),
  tyt_matematik_wrong INTEGER DEFAULT 0 CHECK (tyt_matematik_wrong >= 0 AND tyt_matematik_wrong <= 36),
  tyt_fen_correct INTEGER DEFAULT 0 CHECK (tyt_fen_correct >= 0 AND tyt_fen_correct <= 20),
  tyt_fen_wrong INTEGER DEFAULT 0 CHECK (tyt_fen_wrong >= 0 AND tyt_fen_wrong <= 20),
  tyt_sosyal_correct INTEGER DEFAULT 0 CHECK (tyt_sosyal_correct >= 0 AND tyt_sosyal_correct <= 24),
  tyt_sosyal_wrong INTEGER DEFAULT 0 CHECK (tyt_sosyal_wrong >= 0 AND tyt_sosyal_wrong <= 24),
  
  -- AYT Subject Scores (various question counts)
  ayt_matematik_correct INTEGER DEFAULT 0 CHECK (ayt_matematik_correct >= 0 AND ayt_matematik_correct <= 40),
  ayt_matematik_wrong INTEGER DEFAULT 0 CHECK (ayt_matematik_wrong >= 0 AND ayt_matematik_wrong <= 40),
  ayt_fizik_correct INTEGER DEFAULT 0 CHECK (ayt_fizik_correct >= 0 AND ayt_fizik_correct <= 14),
  ayt_fizik_wrong INTEGER DEFAULT 0 CHECK (ayt_fizik_wrong >= 0 AND ayt_fizik_wrong <= 14),
  ayt_kimya_correct INTEGER DEFAULT 0 CHECK (ayt_kimya_correct >= 0 AND ayt_kimya_correct <= 13),
  ayt_kimya_wrong INTEGER DEFAULT 0 CHECK (ayt_kimya_wrong >= 0 AND ayt_kimya_wrong <= 13),
  ayt_biyoloji_correct INTEGER DEFAULT 0 CHECK (ayt_biyoloji_correct >= 0 AND ayt_biyoloji_correct <= 13),
  ayt_biyoloji_wrong INTEGER DEFAULT 0 CHECK (ayt_biyoloji_wrong >= 0 AND ayt_biyoloji_wrong <= 13),
  ayt_edebiyat_correct INTEGER DEFAULT 0 CHECK (ayt_edebiyat_correct >= 0 AND ayt_edebiyat_correct <= 24),
  ayt_edebiyat_wrong INTEGER DEFAULT 0 CHECK (ayt_edebiyat_wrong >= 0 AND ayt_edebiyat_wrong <= 24),
  ayt_tarih_correct INTEGER DEFAULT 0 CHECK (ayt_tarih_correct >= 0 AND ayt_tarih_correct <= 10),
  ayt_tarih_wrong INTEGER DEFAULT 0 CHECK (ayt_tarih_wrong >= 0 AND ayt_tarih_wrong <= 10),
  ayt_cografya_correct INTEGER DEFAULT 0 CHECK (ayt_cografya_correct >= 0 AND ayt_cografya_correct <= 6),
  ayt_cografya_wrong INTEGER DEFAULT 0 CHECK (ayt_cografya_wrong >= 0 AND ayt_cografya_wrong <= 6),
  ayt_felsefe_correct INTEGER DEFAULT 0 CHECK (ayt_felsefe_correct >= 0 AND ayt_felsefe_correct <= 12),
  ayt_felsefe_wrong INTEGER DEFAULT 0 CHECK (ayt_felsefe_wrong >= 0 AND ayt_felsefe_wrong <= 12),
  ayt_din_correct INTEGER DEFAULT 0 CHECK (ayt_din_correct >= 0 AND ayt_din_correct <= 6),
  ayt_din_wrong INTEGER DEFAULT 0 CHECK (ayt_din_wrong >= 0 AND ayt_din_wrong <= 6),
  
  -- Calculated Net Scores (formula: correct - wrong/4)
  tyt_turkce_net DECIMAL(5,2) GENERATED ALWAYS AS (tyt_turkce_correct - (tyt_turkce_wrong::DECIMAL / 4)) STORED,
  tyt_matematik_net DECIMAL(5,2) GENERATED ALWAYS AS (tyt_matematik_correct - (tyt_matematik_wrong::DECIMAL / 4)) STORED,
  tyt_fen_net DECIMAL(5,2) GENERATED ALWAYS AS (tyt_fen_correct - (tyt_fen_wrong::DECIMAL / 4)) STORED,
  tyt_sosyal_net DECIMAL(5,2) GENERATED ALWAYS AS (tyt_sosyal_correct - (tyt_sosyal_wrong::DECIMAL / 4)) STORED,
  tyt_total_net DECIMAL(6,2) GENERATED ALWAYS AS (
    (tyt_turkce_correct - (tyt_turkce_wrong::DECIMAL / 4)) +
    (tyt_matematik_correct - (tyt_matematik_wrong::DECIMAL / 4)) +
    (tyt_fen_correct - (tyt_fen_wrong::DECIMAL / 4)) +
    (tyt_sosyal_correct - (tyt_sosyal_wrong::DECIMAL / 4))
  ) STORED,
  
  ayt_matematik_net DECIMAL(5,2) GENERATED ALWAYS AS (ayt_matematik_correct - (ayt_matematik_wrong::DECIMAL / 4)) STORED,
  ayt_fen_net DECIMAL(5,2) GENERATED ALWAYS AS (
    (ayt_fizik_correct - (ayt_fizik_wrong::DECIMAL / 4)) +
    (ayt_kimya_correct - (ayt_kimya_wrong::DECIMAL / 4)) +
    (ayt_biyoloji_correct - (ayt_biyoloji_wrong::DECIMAL / 4))
  ) STORED,
  ayt_sosyal_net DECIMAL(5,2) GENERATED ALWAYS AS (
    (ayt_edebiyat_correct - (ayt_edebiyat_wrong::DECIMAL / 4)) +
    (ayt_tarih_correct - (ayt_tarih_wrong::DECIMAL / 4)) +
    (ayt_cografya_correct - (ayt_cografya_wrong::DECIMAL / 4)) +
    (ayt_felsefe_correct - (ayt_felsefe_wrong::DECIMAL / 4)) +
    (ayt_din_correct - (ayt_din_wrong::DECIMAL / 4))
  ) STORED,
  ayt_total_net DECIMAL(6,2) GENERATED ALWAYS AS (
    (ayt_matematik_correct - (ayt_matematik_wrong::DECIMAL / 4)) +
    (ayt_fizik_correct - (ayt_fizik_wrong::DECIMAL / 4)) +
    (ayt_kimya_correct - (ayt_kimya_wrong::DECIMAL / 4)) +
    (ayt_biyoloji_correct - (ayt_biyoloji_wrong::DECIMAL / 4)) +
    (ayt_edebiyat_correct - (ayt_edebiyat_wrong::DECIMAL / 4)) +
    (ayt_tarih_correct - (ayt_tarih_wrong::DECIMAL / 4)) +
    (ayt_cografya_correct - (ayt_cografya_wrong::DECIMAL / 4)) +
    (ayt_felsefe_correct - (ayt_felsefe_wrong::DECIMAL / 4)) +
    (ayt_din_correct - (ayt_din_wrong::DECIMAL / 4))
  ) STORED,
  
  -- Additional Information
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_mock_exam_results_student_id ON mock_exam_results(student_id);
CREATE INDEX idx_mock_exam_results_coach_id ON mock_exam_results(coach_id);
CREATE INDEX idx_mock_exam_results_exam_date ON mock_exam_results(exam_date DESC);
CREATE INDEX idx_mock_exam_results_exam_type ON mock_exam_results(exam_type);

-- Row Level Security (RLS) Policies
ALTER TABLE mock_exam_results ENABLE ROW LEVEL SECURITY;

-- Policy: Coaches can only see/manage their assigned students' exam results
CREATE POLICY "Coaches can manage their students exam results" ON mock_exam_results
  FOR ALL USING (
    coach_id = auth.uid() OR 
    student_id IN (
      SELECT csa.student_id 
      FROM coach_student_assignments csa 
      WHERE csa.coach_id = auth.uid() AND csa.is_active = true
    )
  );

-- Policy: Students can only see their own exam results
CREATE POLICY "Students can view their own exam results" ON mock_exam_results
  FOR SELECT USING (student_id = auth.uid());

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mock_exam_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mock_exam_results_updated_at
  BEFORE UPDATE ON mock_exam_results
  FOR EACH ROW
  EXECUTE FUNCTION update_mock_exam_results_updated_at();

-- Add some sample data (optional)
-- INSERT INTO mock_exam_results (
--   student_id, coach_id, exam_type, exam_date, exam_name,
--   tyt_turkce_correct, tyt_turkce_wrong,
--   tyt_matematik_correct, tyt_matematik_wrong,
--   tyt_fen_correct, tyt_fen_wrong,
--   tyt_sosyal_correct, tyt_sosyal_wrong,
--   notes
-- ) VALUES (
--   'student-uuid-here', 'coach-uuid-here', 'TYT', '2024-12-26', '1. Deneme Sınavı',
--   32, 8,  -- Türkçe: 32 doğru, 8 yanlış
--   28, 8,  -- Matematik: 28 doğru, 8 yanlış  
--   15, 5,  -- Fen: 15 doğru, 5 yanlış
--   20, 4,  -- Sosyal: 20 doğru, 4 yanlış
--   'İlk deneme sınavı sonucu. Matematik konularında eksikler var.'
-- );

COMMENT ON TABLE mock_exam_results IS 'Stores TYT and AYT mock exam results for students with automatic net score calculations';
COMMENT ON COLUMN mock_exam_results.exam_type IS 'TYT or AYT exam type';
COMMENT ON COLUMN mock_exam_results.tyt_total_net IS 'Auto-calculated total TYT net score';
COMMENT ON COLUMN mock_exam_results.ayt_total_net IS 'Auto-calculated total AYT net score'; 