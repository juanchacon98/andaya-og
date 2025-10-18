
-- Asignar rol admin al usuario existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('3513b126-17bb-40fa-b1c7-3b15d6447ece', 'admin_primary'::app_role)
ON CONFLICT DO NOTHING;

-- Actualizar el perfil del admin si no tiene nombre
UPDATE public.profiles
SET full_name = 'Administrador'
WHERE id = '3513b126-17bb-40fa-b1c7-3b15d6447ece'
AND full_name IS NULL;
