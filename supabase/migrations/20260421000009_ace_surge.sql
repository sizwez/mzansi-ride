-- Phase 29: Advanced Cooperative Ecosystem (ACE Surge)

-- 1. Extend Profiles for Fleet Owners
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('rider', 'driver', 'admin', 'fleet_owner'));

-- 2. Extend Trips for Logistics
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'RIDE' CHECK (service_type IN ('RIDE', 'PARCEL'));
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS parcel_metadata JSONB;

-- 3. Community Court System
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id) NOT NULL,
  reporter_id UUID REFERENCES public.profiles(id) NOT NULL,
  accused_id UUID REFERENCES public.profiles(id) NOT NULL,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mediating', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mediation_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID REFERENCES public.disputes(id) NOT NULL,
  mediator_id UUID REFERENCES public.profiles(id) NOT NULL,
  vote TEXT NOT NULL, -- e.g., 'Rider Right', 'Driver Right', 'Mutual Fault'
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(dispute_id, mediator_id)
);

ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mediation_votes ENABLE ROW LEVEL SECURITY;
