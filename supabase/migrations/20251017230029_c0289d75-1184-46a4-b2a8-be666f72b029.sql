-- Fix Security Issues: Restrict public access and remove unrestricted INSERT policies

-- 1. FIX PROFILES TABLE: Restrict to own profile + reservation parties
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "View profiles in active reservations" ON public.profiles 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
    AND (reservations.renter_id = profiles.id OR reservations.owner_id = profiles.id)
    AND reservations.status IN ('approved', 'finished')
  )
);

-- 2. FIX REVIEWS TABLE: Restrict to involved parties only
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

CREATE POLICY "Users can view reviews they're involved in" ON public.reviews 
FOR SELECT USING (
  auth.uid() = reviewer_id 
  OR auth.uid() = reviewee_id 
  OR EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reviews.reservation_id 
    AND (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin_primary')
);

-- 3. FIX LOGIN ATTEMPTS: Remove unrestricted insert policy
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;

-- 4. FIX AUDIT LOGS: Remove unrestricted insert policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- 5. FIX PAYMENTS: Remove unrestricted insert policy
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;

-- 6. Add payment validation constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_amount_positive') THEN
    ALTER TABLE public.payments ADD CONSTRAINT payment_amount_positive CHECK (amount_total > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'upfront_not_exceed_total') THEN
    ALTER TABLE public.payments ADD CONSTRAINT upfront_not_exceed_total CHECK (upfront IS NULL OR upfront <= amount_total);
  END IF;
END $$;

-- 7. Create secure function for role assignment during registration
CREATE OR REPLACE FUNCTION public.assign_initial_role(user_id UUID, role app_role)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;