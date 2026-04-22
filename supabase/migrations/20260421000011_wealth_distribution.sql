-- Phase 31: Wealth Distribution (Fintech & Dividends)

-- 1. Dividend Batches (Tracking platform-wide distribution cycles)
CREATE TABLE IF NOT EXISTS public.dividend_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_pool DECIMAL(12, 2) NOT NULL,
  distributed_amount DECIMAL(12, 2) NOT NULL,
  member_count INTEGER NOT NULL,
  calculation_method TEXT DEFAULT 'weighted_trips_trust' NOT NULL,
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB
);

-- 2. Payout Requests (Member-led cash out requests)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payment_method TEXT NOT NULL,
  account_details JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Extend Profiles for Financial History
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_dividend_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_withdrawn DECIMAL(12, 2) DEFAULT 0.00;

-- 4. Update Wallet Transaction Types
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
  CHECK (type IN ('topup', 'ride_payment', 'refund', 'payout', 'dividend', 'levy_contribution'));

-- 5. Enable RLS
ALTER TABLE public.dividend_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- 6. Policies
CREATE POLICY "Admins can manage dividend batches" ON public.dividend_batches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Public can view dividend batches summary" ON public.dividend_batches FOR SELECT USING (true);

CREATE POLICY "Users can view own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can create payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Admins can manage all payout requests" ON public.payout_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Trigger to log dividend distribution back to fund if needed (Optional)
-- (In Phase 31, dividends are deducted from community_fund table)
