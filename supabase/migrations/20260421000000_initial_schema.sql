-- 1. PROFILES TABLE (Extensions of Auth.Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'rider' CHECK (role IN ('rider', 'driver', 'admin')),
  rating FLOAT DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Rider specific
  wallet_balance DECIMAL(12, 2) DEFAULT 0.00
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('economy', 'comfort', 'xl')),
  capacity INTEGER NOT NULL,
  health_score INTEGER DEFAULT 100,
  next_service DATE,
  rent_to_own_balance DECIMAL(12, 2),
  rent_to_own_total DECIMAL(12, 2)
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 3. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rider_id UUID REFERENCES public.profiles(id) NOT NULL,
  driver_id UUID REFERENCES public.profiles(id),
  pickup_lat FLOAT NOT NULL,
  pickup_lng FLOAT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_name TEXT,
  dropoff_lat FLOAT NOT NULL,
  dropoff_lng FLOAT NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_name TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  vehicle_type TEXT NOT NULL,
  fare_total DECIMAL(12, 2) NOT NULL,
  distance_km FLOAT,
  duration_mins INTEGER,
  payment_method TEXT NOT NULL DEFAULT 'wallet',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 4. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('topup', 'ride_payment', 'refund', 'payout', 'dividend')),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 5. COOPERATIVE VOTING
CREATE TABLE IF NOT EXISTS public.coop_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  votes_for INTEGER DEFAULT 0,
  votes_against INTEGER DEFAULT 0,
  total_eligible INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coop_votes (
  proposal_id UUID REFERENCES public.coop_proposals(id) NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  vote BOOLEAN NOT NULL, -- true for 'for', false for 'against'
  PRIMARY KEY (proposal_id, profile_id)
);

ALTER TABLE public.coop_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_votes ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES
-- Drop existing first to avoid errors if partially applied
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Riders can see their own trips." ON public.trips;
DROP POLICY IF EXISTS "Drivers can see trips they are part of or available requests." ON public.trips;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Riders can see their own trips." ON public.trips FOR SELECT USING (auth.uid() = rider_id);
CREATE POLICY "Drivers can see trips they are part of or available requests." ON public.trips FOR SELECT USING (auth.uid() = driver_id OR status = 'requested');
