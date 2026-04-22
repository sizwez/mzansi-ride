-- PHASE 30: EAGLE EYE OVERSIGHT

-- 1. Extend Profiles for Safety & Reputation
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trust_score DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS is_shadow_banned BOOLEAN DEFAULT false;

-- 2. New Safety Reports Table (for member reporting)
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
  accused_id UUID REFERENCES public.profiles(id) NOT NULL,
  trip_id UUID REFERENCES public.trips(id),
  type TEXT NOT NULL CHECK (type IN ('harassment', 'vandalism', 'reckless_driving', 'fraud', 'other')),
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can report safety issues" ON public.safety_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all safety reports" ON public.safety_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Trigger to Auto-Shadow Ban
-- If trust_score falls below 20, set is_shadow_banned to true
CREATE OR REPLACE FUNCTION check_trust_threshold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trust_score < 20.00 THEN
    NEW.is_shadow_banned := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_trust_update
BEFORE UPDATE OF trust_score ON public.profiles
FOR EACH ROW EXECUTE FUNCTION check_trust_threshold();

-- 4. Update Trip Matching Policies to ignore shadow-banned drivers
-- (We'll handle this in the API service layer as well, but hardening here is better)
DROP POLICY IF EXISTS "Drivers can see available requests" ON public.trips;
CREATE POLICY "Drivers can see available requests" ON public.trips 
FOR SELECT USING (
  status = 'requested' AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'driver' AND is_shadow_banned = false
  )
);
