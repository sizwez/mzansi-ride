-- Phase 37: Cooperative Treasury (Advanced FinTech)

-- 1. Asset Ownership & Value Tracking
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS market_value DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS equity_member DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS equity_coop DECIMAL(12, 2) DEFAULT 0.00;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS depreciation_rate_annual DECIMAL(4, 2) DEFAULT 15.00;

-- 2. Institutional Fund Management
CREATE TABLE IF NOT EXISTS public.treasury_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_type TEXT NOT NULL CHECK (batch_type IN ('dividend_distribution', 'asset_investment', 'operational_reserve', 'emergency_fund')),
  total_amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'executing', 'completed', 'cancelled')),
  authorized_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

-- 3. Rank Performance Multipliers
CREATE TABLE IF NOT EXISTS public.rank_performance_multipliers (
  rank_id TEXT PRIMARY KEY,
  safety_multiplier DECIMAL(4, 2) DEFAULT 1.00,
  efficiency_multiplier DECIMAL(4, 2) DEFAULT 1.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Treasury Audit Log
CREATE TABLE IF NOT EXISTS public.treasury_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  amount DECIMAL(12, 2),
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. RLS for Treasury
ALTER TABLE public.treasury_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rank_performance_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins only access treasury"
  ON public.treasury_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can view rank multipliers"
  ON public.rank_performance_multipliers FOR SELECT
  USING (true);
