-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role app_role;

-- Update the handle_new_user trigger to also save role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'role')::app_role
  );
  RETURN NEW;
END;
$function$;