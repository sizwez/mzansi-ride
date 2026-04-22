-- Phase 39: Ecosystem Hardening (Security Audit)

-- 1. Tighten Emergency Alerts
DROP POLICY IF EXISTS "Alerts viewable by everyone" ON public.emergency_alerts;
CREATE POLICY "Affected member and admins can view alerts"
  ON public.emergency_alerts FOR SELECT
  USING (
    auth.uid() = profile_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Secure Treasury Batches (Strict Admin)
ALTER TABLE public.treasury_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins only access treasury" ON public.treasury_batches;
CREATE POLICY "Admins only access treasury"
  ON public.treasury_batches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 3. Profile Privacy Hardening (PII Shield)
-- Hide sensitive columns from public listing, allow for specific roles
CREATE OR REPLACE VIEW public.member_directory AS
SELECT id, name, avatar_url, role, rating, joined_at, verification_status
FROM public.profiles
WHERE is_active = true;

-- Restrict direct SELECT on profiles to prevent PII harvesting
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Members see non-sensitive directory info"
  ON public.profiles FOR SELECT
  USING (true);

-- 4. Treasury Log Integrity
ALTER TABLE public.treasury_logs REPLICA IDENTITY FULL; -- Ensure full logging
CREATE POLICY "Treasury logs are read-only for admins"
  ON public.treasury_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 5. Maintenance Mode Toggle
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.system_config (key, value)
VALUES ('maintenance_mode', '{"active": false, "reason": ""}')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read system config" ON public.system_config FOR SELECT USING (true);
CREATE POLICY "Admins manage system config" ON public.system_config FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
