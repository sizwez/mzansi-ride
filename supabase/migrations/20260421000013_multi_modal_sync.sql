-- Phase 33: Multi-Modal Sync (Taxi-Ride-Parcel Integration)

-- 1. Extend Trips for Multi-Modal Segments
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS parent_trip_id UUID REFERENCES public.trips(id);
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS segment_index INTEGER DEFAULT 0;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS segment_type TEXT DEFAULT 'RIDE' CHECK (segment_type IN ('RIDE', 'TAXI', 'PARCEL'));
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS combo_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add Handover Column (For tracking hand-offs between drivers)
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS handover_otp TEXT;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS next_segment_id UUID REFERENCES public.trips(id);

-- 3. Update Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_trips_parent_id ON public.trips(parent_trip_id);

-- 4. Function to automatically trigger next segment (Simulated logic)
-- In a real app, this would be an Edge Function, but we'll add a trigger for demonstration
CREATE OR REPLACE FUNCTION public.handle_segment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is a segment of a combo trip and it's being completed
  IF NEW.status = 'completed' AND NEW.next_segment_id IS NOT NULL THEN
    -- Update the next segment to "requested" status to broadcast to drivers
    UPDATE public.trips 
    SET status = 'requested' 
    WHERE id = NEW.next_segment_id AND status = 'requested';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_segment_completed
AFTER UPDATE OF status ON public.trips
FOR EACH ROW EXECUTE FUNCTION public.handle_segment_completion();
