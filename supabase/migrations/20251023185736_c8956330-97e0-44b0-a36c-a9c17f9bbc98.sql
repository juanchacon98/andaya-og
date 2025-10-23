-- Fix SUPA_security_definer_view: Remove security_barrier from v_profiles_basic
-- Security barrier can bypass RLS in some edge cases

-- Drop and recreate the view without security_barrier
DROP VIEW IF EXISTS public.v_profiles_basic CASCADE;

CREATE VIEW public.v_profiles_basic AS
SELECT 
  id,
  full_name,
  kyc_status,
  created_at,
  updated_at
FROM public.profiles
WHERE 
  -- RLS in view: only own user or admins can view
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin_primary', 'admin_security')
  );

-- Grant select to authenticated users
GRANT SELECT ON public.v_profiles_basic TO authenticated;

-- Add helpful comment
COMMENT ON VIEW public.v_profiles_basic IS 
  'Basic profile view without phone numbers. Access controlled via WHERE clause, not security_barrier.';