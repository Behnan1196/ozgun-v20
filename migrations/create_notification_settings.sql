-- Create notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only coordinators/admins can read/write
CREATE POLICY "Coordinators can manage notification settings"
  ON notification_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('coordinator', 'admin')
    )
  );

-- Insert default task check settings
INSERT INTO notification_settings (setting_key, setting_value)
VALUES (
  'task_check',
  '{
    "enabled": false,
    "check_time": "20:00",
    "thank_you_message": "🎉 Harika! Bugünkü tüm görevlerini tamamladın. Tebrikler!",
    "reminder_message": "⏰ Henüz tamamlanmamış görevlerin var. Lütfen kontrol et!"
  }'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;
