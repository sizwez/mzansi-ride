-- Phase 34: Global Expansion (Beyond SA Boundaries)

-- 1. Extend Profiles for Global Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region_code TEXT DEFAULT 'ZA';

-- 2. Extend Trips for Multi-Currency Fares
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ZAR';

-- 3. Exchange Rates Table (Internal Treasury conversions)
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'ZAR',
  target_currency TEXT NOT NULL,
  rate DECIMAL(14, 6) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(base_currency, target_currency)
);

-- 4. Enable RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Anyone can view exchange rates" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "Admins can manage exchange rates" ON public.exchange_rates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. Initial Seed Data
INSERT INTO public.exchange_rates (target_currency, rate)
VALUES 
  ('USD', 0.053), -- 1 ZAR = 0.053 USD
  ('BWP', 0.72),  -- 1 ZAR = 0.72 BWP
  ('SZL', 1.00),  -- 1 ZAR = 1.00 SZL (Pegged)
  ('LSL', 1.00);  -- 1 ZAR = 1.00 LSL (Pegged)
