-- PHASE 21: MZANSI PRIDE SURGE

-- 1. Taxi Ranks Table
CREATE TABLE IF NOT EXISTS public.taxi_ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_lat FLOAT NOT NULL,
  location_lng FLOAT NOT NULL,
  amenities JSONB DEFAULT '[]'::jsonb,
  safety_rating FLOAT DEFAULT 4.5,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Profiles for Localization and POPIA
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_language') THEN
    ALTER TABLE public.profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='popia_consent') THEN
    ALTER TABLE public.profiles ADD COLUMN popia_consent BOOLEAN DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN popia_consent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 3. Initial "Safe Hubs" Data (Jozi & Soweto)
INSERT INTO public.taxi_ranks (name, location_lat, location_lng, amenities, safety_rating)
VALUES 
  ('Baragwanath Transport Interchange', -26.2624, 27.9405, '["WiFi", "Security Post", "Markets", "Toilets"]', 4.8),
  ('MTN/Noord Street Taxi Rank', -26.1985, 28.0463, '["Inter-provincial", "Food Court", "CCTV"]', 4.2),
  ('Bree Street Taxi Rank', -26.2007, 28.0374, '["Covered Loading", "Safe Walkways", "ATMs"]', 4.5);

-- 4. Enable RLS
ALTER TABLE public.taxi_ranks ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Anyone can view taxi ranks" ON public.taxi_ranks FOR SELECT USING (true);
CREATE POLICY "Admins can manage taxi ranks" ON public.taxi_ranks FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
