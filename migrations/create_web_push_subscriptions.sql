-- Create web_push_subscriptions table for browser notifications
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.web_push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Admins and coordinators can view all web push subscriptions" ON public.web_push_subscriptions;

-- RLS Policies
CREATE POLICY "Users can view their own web push subscriptions" 
    ON public.web_push_subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own web push subscriptions" 
    ON public.web_push_subscriptions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own web push subscriptions" 
    ON public.web_push_subscriptions 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own web push subscriptions" 
    ON public.web_push_subscriptions 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins and coordinators can view all web push subscriptions" 
    ON public.web_push_subscriptions 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'coordinator')
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_user_id 
    ON public.web_push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_web_push_subscriptions_endpoint 
    ON public.web_push_subscriptions(endpoint);

-- Grant permissions
GRANT ALL ON public.web_push_subscriptions TO authenticated; 