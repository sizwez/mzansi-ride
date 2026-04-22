-- Phase 32: Institutional Integration (Taxi Association Tools)

-- 1. Taxi Associations Table
CREATE TABLE IF NOT EXISTS public.taxi_associations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_code TEXT UNIQUE NOT NULL,
  region TEXT NOT NULL,
  hq_latitude FLOAT,
  hq_longitude FLOAT,
  monthly_levy DECIMAL(12, 2) DEFAULT 500.00,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Association Routes (Geo-boundaries)
CREATE TABLE IF NOT EXISTS public.association_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID REFERENCES public.taxi_associations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_rank_id UUID REFERENCES public.taxi_ranks(id),
  end_rank_id UUID REFERENCES public.taxi_ranks(id),
  path_coordinates JSONB, -- Array of [lat, lng]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Extend Profiles for Association Membership
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES public.taxi_associations(id);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('rider', 'driver', 'admin', 'fleet_owner', 'association_leader'));

-- 4. Extend Vehicles for Association Compliance
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS association_id UUID REFERENCES public.taxi_associations(id);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS operational_permit_number TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS permit_expiry_at TIMESTAMP WITH TIME ZONE;

-- 5. Enable RLS
ALTER TABLE public.taxi_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.association_routes ENABLE ROW LEVEL SECURITY;

-- 6. Policies
CREATE POLICY "Anyone can view associations" ON public.taxi_associations FOR SELECT USING (true);
CREATE POLICY "Admins can manage associations" ON public.taxi_associations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Association members can view their own routes" ON public.association_routes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (association_id = association_routes.association_id OR role = 'admin'))
);

-- 7. Seed initial associations
INSERT INTO public.taxi_associations (name, short_code, region)
VALUES 
  ('Soweto Taxi Services (STS)', 'STS', 'Gauteng-South'),
  ('Johannesburg Regional Taxi Council', 'JRTC', 'Gauteng-Central'),
  ('Thembisa Taxi Association', 'TTA', 'Gauteng-East');
