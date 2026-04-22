-- Migration: 20260421000002_security_patch.sql

-- 1. VEHICLES SECURITY
DROP POLICY IF EXISTS "Owners can view their own vehicles." ON public.vehicles;
CREATE POLICY "Owners can view their own vehicles." ON public.vehicles 
FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own vehicles." ON public.vehicles;
CREATE POLICY "Owners can update their own vehicles." ON public.vehicles 
FOR UPDATE USING (auth.uid() = owner_id);

-- 2. WALLET SECURITY
DROP POLICY IF EXISTS "Users can view their own transactions." ON public.wallet_transactions;
CREATE POLICY "Users can view their own transactions." ON public.wallet_transactions 
FOR SELECT USING (auth.uid() = profile_id);

-- 3. GOVERNANCE SECURITY
DROP POLICY IF EXISTS "Proposals are viewable by all." ON public.coop_proposals;
CREATE POLICY "Proposals are viewable by all." ON public.coop_proposals 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage proposals." ON public.coop_proposals;
CREATE POLICY "Only admins can manage proposals." ON public.coop_proposals 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Members can view votes." ON public.coop_votes;
CREATE POLICY "Members can view votes." ON public.coop_votes 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members can cast their own vote." ON public.coop_votes;
CREATE POLICY "Members can cast their own vote." ON public.coop_votes 
FOR INSERT WITH CHECK (
  auth.uid() = profile_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND verification_status = 'verified'
  )
);

-- 4. TRIP SECURITY (UPSERT for riders)
DROP POLICY IF EXISTS "Riders can create trip requests." ON public.trips;
CREATE POLICY "Riders can create trip requests." ON public.trips 
FOR INSERT WITH CHECK (auth.uid() = rider_id);

DROP POLICY IF EXISTS "Riders/Drivers can update their trips." ON public.trips;
CREATE POLICY "Riders/Drivers can update their trips." ON public.trips 
FOR UPDATE USING (auth.uid() = rider_id OR auth.uid() = driver_id);
