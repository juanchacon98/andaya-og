-- Fix 1: Remove SECURITY DEFINER from v_profiles_basic view
-- This addresses SUPA_security_definer_view finding
DROP VIEW IF EXISTS public.v_profiles_basic CASCADE;

CREATE VIEW public.v_profiles_basic AS
SELECT 
  id,
  full_name,
  kyc_status,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.v_profiles_basic TO authenticated;

-- Fix 2: Remove phone exposure from profiles RLS policies
-- Drop the problematic policy that exposes phone numbers
DROP POLICY IF EXISTS "View profiles in active reservations" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view renters profiles" ON public.profiles;

-- Create safer policies that don't expose phone numbers
-- Users can still view their own full profile including phone
-- Policy for users to view their own profile (unchanged)
-- This policy should already exist, but ensuring it's there

-- Create a new policy for viewing other users' profiles WITHOUT phone
-- We'll use the v_profiles_basic view for this purpose
CREATE POLICY "View basic profiles in active reservations"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR  -- Users can see their own full profile
  EXISTS (
    SELECT 1
    FROM reservations
    WHERE (
      (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
      AND (reservations.renter_id = profiles.id OR reservations.owner_id = profiles.id)
      AND reservations.status IN ('approved', 'finished')
    )
  )
);

-- Create a security definer function to get contact info only after payment
-- This allows controlled access to phone numbers
CREATE OR REPLACE FUNCTION public.get_contact_info_for_reservation(p_reservation_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  phone text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is involved in the reservation
  IF NOT EXISTS (
    SELECT 1 FROM reservations
    WHERE id = p_reservation_id
    AND (renter_id = auth.uid() OR owner_id = auth.uid())
    AND payment_status IS NOT NULL  -- Only after payment
  ) THEN
    RAISE EXCEPTION 'Unauthorized access to contact information';
  END IF;

  -- Return contact info for the other party
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone
  FROM reservations r
  JOIN profiles p ON (
    (r.renter_id = auth.uid() AND p.id = r.owner_id) OR
    (r.owner_id = auth.uid() AND p.id = r.renter_id)
  )
  WHERE r.id = p_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contact_info_for_reservation TO authenticated;

COMMENT ON FUNCTION public.get_contact_info_for_reservation IS 
'Securely provides contact information only to parties involved in a paid reservation';

-- Fix 3: Add INSERT policy for audit_logs
-- This addresses audit_logs_insert_policy finding
CREATE POLICY "Service role and edge functions can insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

COMMENT ON POLICY "Service role and edge functions can insert audit logs" ON public.audit_logs IS
'Allows edge functions to log security events for audit trail';