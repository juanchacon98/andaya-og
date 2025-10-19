-- Add missing columns for vehicle management
-- Execute this in the Supabase SQL Editor

-- Add is_cover column to vehicle_photos
ALTER TABLE public.vehicle_photos
  ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add deleted_at and updated_at to vehicles
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS trg_vehicles_updated_at ON public.vehicles;
CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_vehicle_photos_updated_at ON public.vehicle_photos;
CREATE TRIGGER trg_vehicle_photos_updated_at
  BEFORE UPDATE ON public.vehicle_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if vehicle has active/future reservations
CREATE OR REPLACE FUNCTION public.vehicle_has_future_or_active_reservations(p_vehicle_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.reservations r
    WHERE r.vehicle_id = p_vehicle_id
      AND r.status IN ('requested','approved','active')
      AND COALESCE(r.end_at, NOW()) >= NOW()
  );
$$;

-- Set first photo of each vehicle as cover (if not already set)
UPDATE public.vehicle_photos vp
SET is_cover = true
WHERE vp.id IN (
  SELECT DISTINCT ON (vehicle_id) id
  FROM public.vehicle_photos
  ORDER BY vehicle_id, sort_order, created_at
)
AND NOT EXISTS (
  SELECT 1 FROM public.vehicle_photos WHERE vehicle_id = vp.vehicle_id AND is_cover = true
);
