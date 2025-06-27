-- Insert Admin User for TYT AYT Coaching System V3.0
-- This script should be run AFTER creating the admin user in Supabase Auth UI

-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID from Supabase Auth
-- You can find this in: Authentication > Users > Click on admin user > Copy User ID

INSERT INTO user_profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'YOUR_ADMIN_USER_ID',  -- Replace with actual admin user ID from Supabase Auth
  'admin@example.com',
  'System Administrator',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Insert some sample TYT/AYT subjects
INSERT INTO subjects (name, description, is_active) VALUES
('Türkçe', 'TYT Türkçe dersi konuları', true),
('Matematik', 'TYT/AYT Matematik dersi konuları', true),
('Fizik', 'AYT Fizik dersi konuları', true),
('Kimya', 'AYT Kimya dersi konuları', true),
('Biyoloji', 'AYT Biyoloji dersi konuları', true),
('Tarih', 'TYT/AYT Tarih dersi konuları', true),
('Coğrafya', 'TYT Coğrafya dersi konuları', true),
('Felsefe', 'TYT Felsefe dersi konuları', true)
ON CONFLICT DO NOTHING;

-- Insert a sample announcement
INSERT INTO announcements (title, content, created_by, is_active) VALUES
(
  'Sisteme Hoş Geldiniz!',
  'TYT AYT Koçluk Sistemi V3.0 aktif olarak çalışmaya başladı. Admin panelinden kullanıcıları, kaynakları ve duyuruları yönetebilirsiniz.',
  'YOUR_ADMIN_USER_ID',  -- Replace with actual admin user ID
  true
)
ON CONFLICT DO NOTHING; 