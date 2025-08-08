-- Create user_activity table for tracking when users are actively viewing specific chat channels
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'ios', 'android')),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one activity record per user per channel
  UNIQUE(user_id, channel_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_channel_id ON user_activity(channel_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_is_active ON user_activity(is_active);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity ON user_activity(last_activity);

-- RLS Policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can manage their own activity
CREATE POLICY "Users can manage own activity" ON user_activity
  FOR ALL USING (auth.uid() = user_id);

-- Service role can access all activity (for webhook)
CREATE POLICY "Service role can access all activity" ON user_activity
  FOR ALL USING (auth.role() = 'service_role');

-- Anonymous role can read activity (for webhook)
CREATE POLICY "Anonymous can read activity" ON user_activity
  FOR SELECT USING (true);

-- Authenticated users can read activity for notification logic
CREATE POLICY "Authenticated can read activity" ON user_activity
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_activity_updated_at
  BEFORE UPDATE ON user_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-cleanup old inactive records (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_activity()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity 
  WHERE is_active = false 
    AND last_activity < (now() - interval '1 hour');
END;
$$ language 'plpgsql';

-- Note: You can set up a periodic job to run cleanup_old_activity() if needed
