-- Extend vehicles table with missing fields
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS vin text, -- serial carrocería (private)
ADD COLUMN IF NOT EXISTS kilometraje integer,
ADD COLUMN IF NOT EXISTS transmission text,
ADD COLUMN IF NOT EXISTS fuel_type text,
ADD COLUMN IF NOT EXISTS delivery_points text[], -- aeropuertos/puntos de entrega
ADD COLUMN IF NOT EXISTS deposit_bs numeric(10,2),
ADD COLUMN IF NOT EXISTS cleaning_fee_bs numeric(10,2),
ADD COLUMN IF NOT EXISTS extra_km_fee_bs numeric(10,2),
ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible',
ADD COLUMN IF NOT EXISTS min_rental_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS km_included integer DEFAULT 200,
ADD COLUMN IF NOT EXISTS delivery_type text, -- 'home_delivery', 'meetup', 'airport'
ADD COLUMN IF NOT EXISTS delivery_cost_bs numeric(10,2),
ADD COLUMN IF NOT EXISTS delivery_zones text[],
ADD COLUMN IF NOT EXISTS rules jsonb, -- owner rules (no smoking, pets, etc)
ADD COLUMN IF NOT EXISTS insurance_number text,
ADD COLUMN IF NOT EXISTS insurance_company text,
ADD COLUMN IF NOT EXISTS insurance_expiry date,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_reason text,
ADD COLUMN IF NOT EXISTS paused_at timestamp with time zone;

-- Rename price_per_day to price_bs for clarity
ALTER TABLE public.vehicles
RENAME COLUMN price_per_day TO price_bs;

-- Add currency column (default VES)
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'VES';

-- Create vehicle_documents table
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- 'circulation_card', 'ownership', etc
  url text NOT NULL,
  ocr_json jsonb,
  confidence numeric(5,2),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own vehicle documents"
ON public.vehicle_documents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE vehicles.id = vehicle_documents.vehicle_id
    AND vehicles.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all vehicle documents"
ON public.vehicle_documents
FOR SELECT
USING (has_role(auth.uid(), 'admin_primary'::app_role));

-- Create vehicle_availability table
CREATE TABLE IF NOT EXISTS public.vehicle_availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  blocked_dates date[],
  pickup_hours text, -- JSON string like "09:00-18:00"
  return_hours text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(vehicle_id)
);

ALTER TABLE public.vehicle_availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own availability"
ON public.vehicle_availability_rules
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE vehicles.id = vehicle_availability_rules.vehicle_id
    AND vehicles.owner_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view availability of active vehicles"
ON public.vehicle_availability_rules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles
    WHERE vehicles.id = vehicle_availability_rules.vehicle_id
    AND vehicles.status = 'active'::vehicle_status
  )
);

-- Create impersonation_sessions table for audit
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  issued_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  revoked_at timestamp with time zone,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view impersonation sessions"
ON public.impersonation_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_primary'::app_role) 
  OR has_role(auth.uid(), 'admin_security'::app_role)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_owner_status ON public.vehicles(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON public.vehicle_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_user ON public.impersonation_sessions(user_id, expires_at);

-- Update trigger for vehicle_documents
CREATE TRIGGER update_vehicle_documents_updated_at
BEFORE UPDATE ON public.vehicle_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();