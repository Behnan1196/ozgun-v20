-- Create video_call_invites table for manual video call invitation system
CREATE TABLE IF NOT EXISTS video_call_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    from_user_name TEXT NOT NULL,
    to_user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_call_invites_from_user_id ON video_call_invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_invites_to_user_id ON video_call_invites(to_user_id);
CREATE INDEX IF NOT EXISTS idx_video_call_invites_status ON video_call_invites(status);
CREATE INDEX IF NOT EXISTS idx_video_call_invites_expires_at ON video_call_invites(expires_at);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS idx_video_call_invites_user_pair_status 
ON video_call_invites(from_user_id, to_user_id, status, expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE video_call_invites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see invites they sent or received
CREATE POLICY "Users can view their own video call invites" ON video_call_invites
    FOR SELECT
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Users can insert invites they are sending
CREATE POLICY "Users can send video call invites" ON video_call_invites
    FOR INSERT
    WITH CHECK (from_user_id = auth.uid());

-- Users can update invites they received (to accept/decline)
CREATE POLICY "Users can respond to received video call invites" ON video_call_invites
    FOR UPDATE
    USING (to_user_id = auth.uid())
    WITH CHECK (to_user_id = auth.uid());

-- Users can update invites they sent (to cancel)
CREATE POLICY "Users can cancel sent video call invites" ON video_call_invites
    FOR UPDATE
    USING (from_user_id = auth.uid())
    WITH CHECK (from_user_id = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_video_call_invites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_video_call_invites_updated_at
    BEFORE UPDATE ON video_call_invites
    FOR EACH ROW
    EXECUTE FUNCTION update_video_call_invites_updated_at();

-- Create function to automatically expire old invites
CREATE OR REPLACE FUNCTION expire_old_video_call_invites()
RETURNS void AS $$
BEGIN
    UPDATE video_call_invites 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT ALL ON video_call_invites TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Insert sample data for testing (optional)
-- INSERT INTO video_call_invites (from_user_id, to_user_id, from_user_name, to_user_name, message, expires_at)
-- VALUES 
-- (
--     '00000000-0000-0000-0000-000000000001'::uuid,
--     '00000000-0000-0000-0000-000000000002'::uuid,
--     'Test Coach',
--     'Test Student',
--     'Let''s discuss your math progress',
--     NOW() + INTERVAL '5 minutes'
-- );

COMMENT ON TABLE video_call_invites IS 'Table to store manual video call invitations between coaches and students';
COMMENT ON COLUMN video_call_invites.from_user_id IS 'ID of the user sending the invitation';
COMMENT ON COLUMN video_call_invites.to_user_id IS 'ID of the user receiving the invitation';
COMMENT ON COLUMN video_call_invites.status IS 'Current status of the invitation: pending, accepted, declined, or expired';
COMMENT ON COLUMN video_call_invites.message IS 'Optional message included with the invitation';
COMMENT ON COLUMN video_call_invites.expires_at IS 'When the invitation expires (typically 5 minutes after creation)'; 