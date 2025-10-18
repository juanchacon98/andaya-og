-- Add pickup and return hours columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS pickup_hours TEXT,
ADD COLUMN IF NOT EXISTS return_hours TEXT;

COMMENT ON COLUMN public.vehicles.pickup_hours IS 'Horario de recogida del vehículo (ej: 8:00 AM - 6:00 PM)';
COMMENT ON COLUMN public.vehicles.return_hours IS 'Horario de devolución del vehículo (ej: 8:00 AM - 6:00 PM)';