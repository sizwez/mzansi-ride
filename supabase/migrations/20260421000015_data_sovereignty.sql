-- Phase 36: Data Sovereignty (Personal Identity & Privacy)

-- 1. Extend Profiles for Privacy Control
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "show_trip_history": true,
  "share_location_with_rank": true,
  "marketing_consent": false,
  "anonymize_older_trips": false
}';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Function to Anonymize User Data (GDPR/POPIA "Right to be Forgotten")
CREATE OR REPLACE FUNCTION public.anonymize_profile(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET 
    name = 'Anonymized Member',
    email = user_uuid || '@anonymized.mzansi',
    phone = NULL,
    avatar_url = NULL,
    is_active = false,
    anonymized_at = now()
  WHERE id = user_uuid;
  
  -- Remove precise location history if requested (example logic)
  UPDATE public.trips 
  SET 
    pickup_address = 'REDACTED',
    dropoff_address = 'REDACTED',
    pickup_lat = 0,
    pickup_lng = 0,
    dropoff_lat = 0,
    dropoff_lng = 0
  WHERE rider_id = user_uuid;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies to respect active status
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
  ON public.profiles FOR SELECT 
  USING (is_active = true);

-- Allow admins to see even anonymized profiles for audit
CREATE POLICY "Admins can view all profiles for audit"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
