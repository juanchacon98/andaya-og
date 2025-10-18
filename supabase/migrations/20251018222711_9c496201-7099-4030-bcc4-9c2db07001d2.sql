-- Allow vehicle owners to view profiles of users who have reserved their vehicles
CREATE POLICY "Owners can view renters profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.vehicles v
    INNER JOIN public.reservations r ON r.vehicle_id = v.id
    WHERE v.owner_id = auth.uid()
    AND r.renter_id = profiles.id
  )
);