-- Fix ambiguous user_id error in assign_initial_role function
DROP FUNCTION IF EXISTS public.assign_initial_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.assign_initial_role(_user_id UUID, _role app_role)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$ LANGUAGE plpgsql;