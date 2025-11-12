-- Fix RLS Policies - Use user_profiles instead of auth.users for role checks

-- Drop and recreate policies with correct user_profiles references

-- Announcements policies
DROP POLICY IF EXISTS "Everyone can view active announcements" ON announcements;
CREATE POLICY "Everyone can view active announcements" ON announcements
    FOR SELECT USING (
        is_active = true 
        AND (starts_at IS NULL OR starts_at <= NOW()) 
        AND (ends_at IS NULL OR ends_at >= NOW())
    );

DROP POLICY IF EXISTS "Coordinators can manage announcements" ON announcements;
CREATE POLICY "Coordinators can manage announcements" ON announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'admin')
        )
    );

-- Notification campaigns policies
DROP POLICY IF EXISTS "Coordinators can manage notification campaigns" ON notification_campaigns;
CREATE POLICY "Coordinators can manage notification campaigns" ON notification_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'admin')
        )
    );

-- Automated rules policies
DROP POLICY IF EXISTS "Coordinators can manage automated rules" ON automated_notification_rules;
CREATE POLICY "Coordinators can manage automated rules" ON automated_notification_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles p 
            WHERE p.id = auth.uid() AND p.role IN ('coordinator', 'admin')
        )
    );

-- Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT ALL ON announcements TO authenticated;
GRANT ALL ON notification_campaigns TO authenticated;
GRANT ALL ON automated_notification_rules TO authenticated;

-- Log the fix
SELECT 'RLS policies fixed successfully' as fix_status;