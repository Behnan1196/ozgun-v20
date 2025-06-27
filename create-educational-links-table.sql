-- Educational Links Table for Admin Management
-- This table will store useful educational links that admins can manage
-- and coaches/students can access through the Araçlar tab

CREATE TABLE IF NOT EXISTS public.educational_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    icon_letter VARCHAR(1), -- Single letter for icon display (e.g., 'Ö' for ÖSYM)
    icon_color VARCHAR(20) DEFAULT 'blue', -- Color theme: blue, green, red, purple, orange, indigo, etc.
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    target_audience VARCHAR(20) DEFAULT 'all', -- 'all', 'coaches', 'students'
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_educational_links_active ON public.educational_links(is_active);
CREATE INDEX IF NOT EXISTS idx_educational_links_category ON public.educational_links(category);
CREATE INDEX IF NOT EXISTS idx_educational_links_order ON public.educational_links(display_order);
CREATE INDEX IF NOT EXISTS idx_educational_links_audience ON public.educational_links(target_audience);

-- Enable Row Level Security
ALTER TABLE public.educational_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow admins to manage all links
CREATE POLICY "Admins can manage educational links" ON public.educational_links
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

-- Allow coaches to read active links
CREATE POLICY "Coaches can read active educational links" ON public.educational_links
    FOR SELECT USING (
        is_active = true 
        AND target_audience IN ('all', 'coaches')
        AND EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'coach'
        )
    );

-- Allow students to read active links
CREATE POLICY "Students can read active educational links" ON public.educational_links
    FOR SELECT USING (
        is_active = true 
        AND target_audience IN ('all', 'students')
        AND EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role = 'student'
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_educational_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_educational_links_updated_at
    BEFORE UPDATE ON public.educational_links
    FOR EACH ROW
    EXECUTE FUNCTION update_educational_links_updated_at();

-- Insert sample educational links
INSERT INTO public.educational_links (title, description, url, category, icon_letter, icon_color, display_order, target_audience) VALUES
('ÖSYM Resmi Sitesi', 'Sınav duyuruları ve resmi bilgiler', 'https://osym.gov.tr', 'official', 'Ö', 'blue', 1, 'all'),
('Khan Academy', 'Ücretsiz eğitim videoları', 'https://www.khanacademy.org/tr', 'educational', 'K', 'green', 2, 'all'),
('EBA Platform', 'MEB resmi eğitim platformu', 'https://www.eba.gov.tr', 'official', 'E', 'indigo', 3, 'all'),
('TYT Matematik Videoları', 'YouTube eğitim içerikleri', 'https://www.youtube.com/results?search_query=TYT+matematik', 'video', 'Y', 'red', 4, 'all'),
('AYT Fizik Kaynakları', 'Fizik dersi için faydalı kaynaklar', 'https://www.youtube.com/results?search_query=AYT+fizik', 'video', 'F', 'purple', 5, 'all'),
('Türkçe Test Çöz', 'Online Türkçe testleri', 'https://www.testcozumle.com/turkce', 'practice', 'T', 'orange', 6, 'all');

-- Grant necessary permissions
GRANT ALL ON public.educational_links TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Comment on table
COMMENT ON TABLE public.educational_links IS 'Educational links that can be managed by admins and accessed by coaches and students'; 