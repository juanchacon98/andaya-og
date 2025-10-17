-- Fix the assign_initial_role function to prevent privilege escalation
CREATE OR REPLACE FUNCTION public.assign_initial_role(_user_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- CRITICAL: Verify caller is assigning role to themselves
  IF auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Cannot assign roles to other users';
  END IF;
  
  -- CRITICAL: Only allow non-admin roles during registration
  IF _role NOT IN ('renter', 'owner') THEN
    RAISE EXCEPTION 'Invalid role for initial assignment';
  END IF;
  
  -- CRITICAL: Ensure user doesn't already have a role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already has assigned role';
  END IF;
  
  -- Safe to insert now
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role);
END;
$function$;

-- Add policy for admins to delete KYC documents
CREATE POLICY "Admins can delete KYC documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kyc_documents'
  AND (has_role(auth.uid(), 'admin_primary'::app_role) OR has_role(auth.uid(), 'admin_security'::app_role))
);