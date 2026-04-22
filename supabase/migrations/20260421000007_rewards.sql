-- 20260421000007_rewards.sql
-- Phase 25: Mzansi Rewards System

-- Add reward points to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0;

-- Create rewards history table
CREATE TABLE IF NOT EXISTS public.rewards_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive for earn, negative for redeem
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'trip_earn', 'redemption', 'bonus', 'donation'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rewards_history ENABLE ROW LEVEL SECURITY;

-- Policies for rewards_history
CREATE POLICY "Users can view their own reward history"
    ON public.rewards_history FOR SELECT
    USING (auth.uid() = profile_id);

-- Only service role or triggers should insert/update rewards in production
-- For development, we allow profiles to READ points from profiles table already.

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_rewards_profile_id ON public.rewards_history(profile_id);
