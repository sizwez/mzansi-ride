-- 20. Add association_id to profiles (optional foreign key to association tables)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS association_id UUID;

-- Optionally, add a foreign key if the associations table exists (adjust table name if needed)
-- ALTER TABLE public.profiles ADD CONSTRAINT fk_association FOREIGN KEY (association_id) REFERENCES public.associations(id) ON DELETE SET NULL;
