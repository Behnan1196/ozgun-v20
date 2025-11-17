-- Insert default automated notification rules
-- Run this after creating the comprehensive notification system

-- Get the first coordinator user ID (you'll need to replace this with actual coordinator ID)
-- For now, we'll use a placeholder that needs to be updated

-- Daily Task Reminder (runs at 20:00 every day)
INSERT INTO automated_notification_rules (
    name,
    description,
    rule_type,
    trigger_conditions,
    title_template,
    body_template,
    is_active,
    target_audience,
    created_by
) VALUES (
    'Günlük Görev Hatırlatıcısı',
    'Öğrencilere günlük görevlerini hatırlatır',
    'daily_task_reminder',
    '{"time": "20:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]}'::jsonb,
    'Günlük Görevlerin',
    'Bugün için {incomplete_task_count} adet tamamlanmamış görevin var. Hadi başlayalım! 💪',
    true,
    'students',
    (SELECT id FROM user_profiles WHERE role = 'coordinator' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Task Completion Thanks (runs at 21:00 every day)
INSERT INTO automated_notification_rules (
    name,
    description,
    rule_type,
    trigger_conditions,
    title_template,
    body_template,
    is_active,
    target_audience,
    created_by
) VALUES (
    'Görev Tamamlama Teşekkürü',
    'Günlük görevlerini tamamlayan öğrencilere teşekkür mesajı',
    'task_completion_thanks',
    '{"time": "21:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]}'::jsonb,
    'Harika İş! 🎉',
    'Bugünkü tüm görevlerini tamamladın! Süpersin {full_name}! 🌟',
    false,
    'students',
    (SELECT id FROM user_profiles WHERE role = 'coordinator' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Exam Reminder (runs at 19:00 every day)
INSERT INTO automated_notification_rules (
    name,
    description,
    rule_type,
    trigger_conditions,
    title_template,
    body_template,
    is_active,
    target_audience,
    created_by
) VALUES (
    'Sınav Hatırlatıcısı',
    'Yarın sınavı olan öğrencilere hatırlatma',
    'exam_reminder',
    '{"time": "19:00", "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]}'::jsonb,
    'Yarın Sınavın Var! 📝',
    'Yarın sınavın var. Hazırlığını kontrol et! 💪',
    false,
    'students',
    (SELECT id FROM user_profiles WHERE role = 'coordinator' LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Weekly Summary (runs at 18:00 on Sundays)
INSERT INTO automated_notification_rules (
    name,
    description,
    rule_type,
    trigger_conditions,
    title_template,
    body_template,
    is_active,
    target_audience,
    created_by
) VALUES (
    'Haftalık Özet',
    'Haftalık performans özeti',
    'weekly_summary',
    '{"time": "18:00", "days": ["sunday"]}'::jsonb,
    'Haftalık Özetin 📊',
    'Bu hafta {completed_tasks} görev tamamladın ve {study_hours} saat çalıştın. Harika gidiyorsun!',
    false,
    'students',
    (SELECT id FROM user_profiles WHERE role = 'coordinator' LIMIT 1)
) ON CONFLICT DO NOTHING;

SELECT 'Default notification rules inserted successfully' as status;
