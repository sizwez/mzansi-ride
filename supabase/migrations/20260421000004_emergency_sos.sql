-- PHASE 19: EMERGENCY SOS & COMMUNITY FUND

-- 1. Emergency Alerts Table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  trip_id UUID REFERENCES public.trips(id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT
);

-- 2. Community Fund (Stokvel Model)
CREATE TABLE IF NOT EXISTS public.community_fund (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  balance DECIMAL(12, 2) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initialize fund if not exists
INSERT INTO public.community_fund (balance)
SELECT 0.00 WHERE NOT EXISTS (SELECT 1 FROM public.community_fund);

-- 3. Community Fund Transactions (For Transparency)
CREATE TABLE IF NOT EXISTS public.fund_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID REFERENCES public.trips(id),
  type TEXT NOT NULL CHECK (type IN ('levy_credit', 'emergency_payout', 'admin_adjustment')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create an SOS" ON public.emergency_alerts FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Admins and affected users can view alerts" ON public.emergency_alerts FOR SELECT USING (
  auth.uid() = profile_id OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public can view fund balance" ON public.community_fund FOR SELECT USING (true);
CREATE POLICY "Only admins can modify fund" ON public.community_fund FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Fund transactions are viewable by all members" ON public.fund_transactions FOR SELECT USING (true);

-- Function to update fund balance automatically on transaction
CREATE OR REPLACE FUNCTION update_community_fund_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.community_fund 
  SET balance = balance + NEW.amount, 
      last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_fund_transaction
AFTER INSERT ON public.fund_transactions
FOR EACH ROW EXECUTE FUNCTION update_community_fund_balance();
