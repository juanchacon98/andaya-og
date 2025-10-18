-- Add foreign key from vehicles.owner_id to profiles.id
ALTER TABLE public.vehicles 
DROP CONSTRAINT IF EXISTS vehicles_owner_id_fkey;

ALTER TABLE public.vehicles
ADD CONSTRAINT vehicles_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Create an index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_id ON public.vehicles(owner_id);