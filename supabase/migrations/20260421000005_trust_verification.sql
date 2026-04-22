-- PHASE 20: DRIVER KYC & TRUST VERIFICATION

-- 1. Driver Documents Table
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('id_card', 'pdp', 'vehicle_registration', 'insurance')),
  doc_url TEXT NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE
);

-- 2. Biometric Verification Records (Mock/Liveness)
CREATE TABLE IF NOT EXISTS public.biometric_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  selfie_url TEXT NOT NULL,
  liveness_score FLOAT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_checks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Drivers can manage their own docs" ON public.driver_documents FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Admins can view and update all docs" ON public.driver_documents FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Drivers can view their own biometric checks" ON public.biometric_checks FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Admins can view all biometric checks" ON public.biometric_checks FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Index for searching expiring docs
CREATE INDEX idx_docs_expiry ON public.driver_documents(expiry_date) WHERE status = 'verified';
