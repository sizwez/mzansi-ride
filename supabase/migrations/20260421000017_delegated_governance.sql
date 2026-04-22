-- Phase 38: Community Governance (Delegated Democracy)

-- 1. Delegation Table
CREATE TABLE IF NOT EXISTS public.coop_delegations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID REFERENCES public.profiles(id) NOT NULL,
  delegate_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'finance', 'safety', 'ops')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Prevent double delegation in same category
  UNIQUE (delegator_id, category)
);

-- 2. Update Votes to handle weight
ALTER TABLE public.coop_votes ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1;

-- 3. RLS for Delegations
ALTER TABLE public.coop_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage their own delegations"
  ON public.coop_delegations FOR ALL
  USING (auth.uid() = delegator_id);

CREATE POLICY "Delegations are viewable by all members"
  ON public.coop_delegations FOR SELECT
  USING (true);

-- 4. Constraint to prevent self-delegation
ALTER TABLE public.coop_delegations ADD CONSTRAINT no_self_delegation CHECK (delegator_id != delegate_id);
