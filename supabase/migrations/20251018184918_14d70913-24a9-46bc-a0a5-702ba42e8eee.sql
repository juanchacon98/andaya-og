-- Arreglar políticas RLS para kyc_verifications
DROP POLICY IF EXISTS "Admins can view all KYC" ON public.kyc_verifications;
DROP POLICY IF EXISTS "Users can view own KYC" ON public.kyc_verifications;

CREATE POLICY "Admins can view all KYC"
ON public.kyc_verifications
FOR SELECT
USING (
  has_role(auth.uid(), 'admin_primary'::app_role) OR 
  has_role(auth.uid(), 'admin_security'::app_role)
);

CREATE POLICY "Users can view own KYC"
ON public.kyc_verifications
FOR SELECT
USING (auth.uid() = user_id);