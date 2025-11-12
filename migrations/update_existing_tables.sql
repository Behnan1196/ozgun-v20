-- Migration: Update existing tables and create missing ones
-- This migration safely updates existing tables and creates missing ones

-- First, let's check and update the announcements table
DO $$ 
BEGIN
    -- Add missing columns to announcements table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_audience') THEN
        ALTER TABLE announcements ADD COLUMN target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'students', 'coaches', 'coordinators'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'announcement_type') THEN
        ALTER TABLE announcements ADD COLUMN announcement_type TEXT NOT NULL DEFAULT 'general' CHECK (announcement_type IN ('general', 'urgent', 'maintenance', 'feature', 'exam'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'priority') THEN
        ALTER TABLE announcements ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'starts_at') THEN
        ALTER TABLE announcements ADD COLUMN starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'ends_at') THEN
        ALTER TABLE announcements ADD COLUMN ends_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active') THEN
        ALTER TABLE announcements ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_pinned') THEN
        ALTER TABLE announcements ADD COLUMN is_pinned BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'show_on_login') THEN
        ALTER TABLE announcements ADD COLUMN show_on_login BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'view_count') THEN
        ALTER TABLE announcements ADD COLUMN view_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'click_count') THEN
        ALTER TABLE announcements ADD COLUMN click_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'updated_at') THEN
        ALTER TABLE announcements ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create announcement_views table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcement_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(announcement_id, user_id)
);

-- Create notification_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    
    -- Targeting
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'coaches', 'coordinators', 'custom')),
    target_user_ids UUID[], -- For custom targeting
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Settings
    is_urgent BOOLEAN DEFAULT false,
    include_sound BOOLEAN DEFAULT true,
    custom_data JSONB DEFAULT '{}',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    
    -- Analytics
    total_recipients INTEGER DEFAULT 0,
    successful_sends INTEGER DEFAULT 0,
    failed_sends INTEGER DEFAULT 0,
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automated_notification_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS automated_notification_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Rule type
    rule_type TEXT NOT NULL CHECK (rule_type IN (
        'daily_task_reminder',
        'task_completion_thanks', 
        'exam_reminder',
        'weekly_summary',
        'goal_progress',
        'coach_message'
    )),
    
    -- Trigger conditions
    trigger_conditions JSONB NOT NULL, -- e.g., {"time": "18:00", "days": ["monday", "tuesday"]}
    
    -- Message template
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('students', 'coaches', 'all')),
    
    -- Metadata
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_executed_at TIMESTAMP WITH TIME ZONE
);

-- Create notification_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'announcement', 'task_reminder', 'task_completion', 'exam_reminder', 
        'weekly_summary', 'goal_progress', 'coach_message', 'system', 'custom'
    )),
    
    -- Source tracking
    source_type TEXT NOT NULL CHECK (source_type IN ('campaign', 'automated_rule', 'manual', 'system')),
    source_id UUID, -- References campaign_id or rule_id
    
    -- Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Processing status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Settings
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest, 10 = lowest
    include_sound BOOLEAN DEFAULT true,
    custom_data JSONB DEFAULT '{}',
    
    -- Results
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- General preferences
    enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    
    -- Notification type preferences
    task_reminders BOOLEAN DEFAULT true,
    task_completion_thanks BOOLEAN DEFAULT true,
    exam_reminders BOOLEAN DEFAULT true,
    weekly_summaries BOOLEAN DEFAULT true,
    goal_progress BOOLEAN DEFAULT true,
    coach_messages BOOLEAN DEFAULT true,
    announcements BOOLEAN DEFAULT true,
    
    -- Delivery preferences
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Now create indexes safely
DO $$ 
BEGIN
    -- Check if columns exist before creating indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_audience') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcements_active_audience') THEN
            CREATE INDEX idx_announcements_active_audience ON announcements(is_active, target_audience, starts_at, ends_at);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcements_priority') THEN
            CREATE INDEX idx_announcements_priority ON announcements(priority, is_pinned, created_at DESC);
        END IF;
    END IF;
    
    -- Announcement views indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcement_views') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_announcement_views_user') THEN
            CREATE INDEX idx_announcement_views_user ON announcement_views(user_id, viewed_at DESC);
        END IF;
    END IF;
    
    -- Notification campaigns indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_campaigns') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_campaigns_status') THEN
            CREATE INDEX idx_notification_campaigns_status ON notification_campaigns(status, scheduled_for);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_campaigns_audience') THEN
            CREATE INDEX idx_notification_campaigns_audience ON notification_campaigns(target_audience, scheduled_for);
        END IF;
    END IF;
    
    -- Automated rules indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automated_notification_rules') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_automated_rules_active') THEN
            CREATE INDEX idx_automated_rules_active ON automated_notification_rules(is_active, rule_type);
        END IF;
    END IF;
    
    -- Notification queue indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_queue') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_queue_processing') THEN
            CREATE INDEX idx_notification_queue_processing ON notification_queue(status, priority, scheduled_for);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notification_queue_user') THEN
            CREATE INDEX idx_notification_queue_user ON notification_queue(user_id, created_at DESC);
        END IF;
    END IF;
    
    -- User preferences indexes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notification_preferences') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_preferences_user') THEN
            CREATE INDEX idx_user_preferences_user ON user_notification_preferences(user_id);
        END IF;
    END IF;
END $$;

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS trigger_announcements_updated_at ON announcements;
CREATE TRIGGER trigger_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_campaigns_updated_at ON notification_campaigns;
CREATE TRIGGER trigger_notification_campaigns_updated_at 
    BEFORE UPDATE ON notification_campaigns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_automated_notification_rules_updated_at ON automated_notification_rules;
CREATE TRIGGER trigger_automated_notification_rules_updated_at 
    BEFORE UPDATE ON automated_notification_rules 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_notification_queue_updated_at ON notification_queue;
CREATE TRIGGER trigger_notification_queue_updated_at 
    BEFORE UPDATE ON notification_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_user_notification_preferences_updated_at 
    BEFORE UPDATE ON user_notification_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies safely
DO $$ 
BEGIN
    -- Announcements policies
    DROP POLICY IF EXISTS "Everyone can view active announcements" ON announcements;
    CREATE POLICY "Everyone can view active announcements" ON announcements
        FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= NOW()) AND (ends_at IS NULL OR ends_at >= NOW()));

    DROP POLICY IF EXISTS "Coordinators can manage announcements" ON announcements;
    CREATE POLICY "Coordinators can manage announcements" ON announcements
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM auth.users u 
                JOIN user_profiles p ON u.id = p.id 
                WHERE u.id = auth.uid() AND p.role IN ('coordinator', 'admin')
            )
        );

    -- Announcement views policies
    DROP POLICY IF EXISTS "Users can manage their own announcement views" ON announcement_views;
    CREATE POLICY "Users can manage their own announcement views" ON announcement_views
        FOR ALL USING (auth.uid() = user_id);

    -- Notification campaigns policies
    DROP POLICY IF EXISTS "Coordinators can manage notification campaigns" ON notification_campaigns;
    CREATE POLICY "Coordinators can manage notification campaigns" ON notification_campaigns
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM auth.users u 
                JOIN user_profiles p ON u.id = p.id 
                WHERE u.id = auth.uid() AND p.role IN ('coordinator', 'admin')
            )
        );

    -- Automated rules policies
    DROP POLICY IF EXISTS "Coordinators can manage automated rules" ON automated_notification_rules;
    CREATE POLICY "Coordinators can manage automated rules" ON automated_notification_rules
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM auth.users u 
                JOIN user_profiles p ON u.id = p.id 
                WHERE u.id = auth.uid() AND p.role IN ('coordinator', 'admin')
            )
        );

    -- Notification queue policies
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notification_queue;
    CREATE POLICY "Users can view their own notifications" ON notification_queue
        FOR SELECT USING (auth.uid() = user_id);

    -- User preferences policies
    DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON user_notification_preferences;
    CREATE POLICY "Users can manage their own notification preferences" ON user_notification_preferences
        FOR ALL USING (auth.uid() = user_id);

    -- Service role policies
    DROP POLICY IF EXISTS "Service role can manage all announcement data" ON announcements;
    CREATE POLICY "Service role can manage all announcement data" ON announcements
        FOR ALL USING (auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Service role can manage all announcement views" ON announcement_views;
    CREATE POLICY "Service role can manage all announcement views" ON announcement_views
        FOR ALL USING (auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Service role can manage all campaigns" ON notification_campaigns;
    CREATE POLICY "Service role can manage all campaigns" ON notification_campaigns
        FOR ALL USING (auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Service role can manage all rules" ON automated_notification_rules;
    CREATE POLICY "Service role can manage all rules" ON automated_notification_rules
        FOR ALL USING (auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Service role can manage all queue items" ON notification_queue;
    CREATE POLICY "Service role can manage all queue items" ON notification_queue
        FOR ALL USING (auth.role() = 'service_role');

    DROP POLICY IF EXISTS "Service role can manage all preferences" ON user_notification_preferences;
    CREATE POLICY "Service role can manage all preferences" ON user_notification_preferences
        FOR ALL USING (auth.role() = 'service_role');
END $$;

-- Grant permissions
GRANT SELECT ON announcements TO authenticated;
GRANT ALL ON announcement_views TO authenticated;
GRANT ALL ON user_notification_preferences TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Create utility functions
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS void AS $$
BEGIN
    -- This function will be called by a cron job or background worker
    -- It processes pending notifications in the queue
    
    UPDATE notification_queue 
    SET status = 'processing', updated_at = NOW()
    WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    AND attempts < max_attempts;
    
    -- The actual sending will be handled by the application layer
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION cleanup_notification_data()
RETURNS void AS $$
BEGIN
    -- Clean up old notification queue items (keep last 30 days)
    DELETE FROM notification_queue 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('sent', 'failed', 'cancelled');
    
    -- Clean up old announcement views (keep last 90 days)
    DELETE FROM announcement_views 
    WHERE viewed_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Log the migration
SELECT 'Notification system tables updated and created successfully' as migration_status;