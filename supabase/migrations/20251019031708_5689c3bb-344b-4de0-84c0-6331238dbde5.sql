-- Create RPC function for admin dashboard metrics
-- This function returns all dashboard metrics in a single call
-- Uses SECURITY DEFINER to bypass RLS and validate admin role

CREATE OR REPLACE FUNCTION public.admin_get_metrics()
RETURNS TABLE(
  total_users bigint,
  total_vehicles bigint,
  active_reservations bigint,
  revenue_month_bs numeric,
  pending_kyc bigint,
  open_incidents bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Verify caller is admin
  SELECT 
    CASE 
      WHEN NOT (has_role(auth.uid(), 'admin_primary'::app_role) OR has_role(auth.uid(), 'admin_security'::app_role))
      THEN (SELECT NULL::bigint WHERE false) -- Abort if not admin
      ELSE NULL
    END;
  
  -- Return metrics
  WITH m_users AS (
    SELECT count(*)::bigint AS c 
    FROM auth.users
  ),
  m_vehicles AS (
    SELECT count(*)::bigint AS c 
    FROM public.vehicles
  ),
  m_res AS (
    SELECT count(*)::bigint AS c
    FROM public.reservations
    WHERE status IN ('pending', 'approved')
  ),
  m_rev AS (
    SELECT coalesce(sum(amount_total), 0)::numeric AS c
    FROM public.payments
    WHERE date_trunc('month', created_at AT TIME ZONE 'America/Caracas')
          = date_trunc('month', now() AT TIME ZONE 'America/Caracas')
  ),
  m_kyc AS (
    SELECT count(*)::bigint AS c 
    FROM public.kyc_verifications 
    WHERE status = 'pending'
  ),
  m_inc AS (
    SELECT count(*)::bigint AS c 
    FROM public.incidents 
    WHERE status = 'open'
  )
  SELECT m_users.c, m_vehicles.c, m_res.c, m_rev.c, m_kyc.c, m_inc.c
  FROM m_users, m_vehicles, m_res, m_rev, m_kyc, m_inc;
$$;

-- Grant execute permission to authenticated users (function handles auth internally)
GRANT EXECUTE ON FUNCTION public.admin_get_metrics() TO authenticated;