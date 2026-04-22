-- Migration: 20260421000001_governance_updates.sql

-- 1. Extend profiles for shares and benefits
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS benefits_medical_aid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS benefits_funeral_policy BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS benefits_retirement BOOLEAN DEFAULT FALSE;

-- 2. Trigger function to update vote counts automatically
CREATE OR REPLACE FUNCTION public.handle_vote_cast()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = TRUE THEN
      UPDATE public.coop_proposals SET votes_for = votes_for + 1 WHERE id = NEW.proposal_id;
    ELSE
      UPDATE public.coop_proposals SET votes_against = votes_against + 1 WHERE id = NEW.proposal_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = TRUE THEN
      UPDATE public.coop_proposals SET votes_for = votes_for - 1 WHERE id = OLD.proposal_id;
    ELSE
      UPDATE public.coop_proposals SET votes_against = votes_against - 1 WHERE id = OLD.proposal_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply trigger to coop_votes
DROP TRIGGER IF EXISTS on_vote_cast ON public.coop_votes;
CREATE TRIGGER on_vote_cast
AFTER INSERT OR DELETE ON public.coop_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_vote_cast();
