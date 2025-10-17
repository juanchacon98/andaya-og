-- Create enums
CREATE TYPE public.app_role AS ENUM ('renter', 'owner', 'admin_primary', 'admin_security');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.vehicle_type AS ENUM ('sedan', 'suv', 'hatchback', 'pickup', 'moto', 'van', 'coupe', 'otro');
CREATE TYPE public.vehicle_status AS ENUM ('pending_review', 'active', 'paused', 'rejected');
CREATE TYPE public.availability_kind AS ENUM ('available', 'blocked');
CREATE TYPE public.reservation_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'finished');
CREATE TYPE public.payment_method AS ENUM ('full', 'cashea_sim');
CREATE TYPE public.payment_status AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');
CREATE TYPE public.incident_status AS ENUM ('open', 'in_review', 'resolved');
CREATE TYPE public.access_scope AS ENUM ('admin_panel', 'admin_sec_panel');
CREATE TYPE public.access_rule AS ENUM ('allow', 'deny');
CREATE TYPE public.backup_status AS ENUM ('ok', 'failed');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- KYC verifications
CREATE TABLE public.kyc_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status kyc_status DEFAULT 'pending',
  id_number TEXT,
  driver_license_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  license_front_url TEXT,
  license_back_url TEXT,
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login attempts
CREATE TABLE public.login_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year SMALLINT NOT NULL,
  type vehicle_type NOT NULL,
  description TEXT,
  plate TEXT,
  price_per_day NUMERIC(10,2) NOT NULL,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  city TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status vehicle_status DEFAULT 'pending_review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle photos
CREATE TABLE public.vehicle_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicle availability
CREATE TABLE public.vehicle_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  kind availability_kind NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservations
CREATE TABLE public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  renter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  daily_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  service_fee NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status reservation_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  method payment_method NOT NULL,
  status payment_status DEFAULT 'pending',
  currency TEXT DEFAULT 'COP',
  amount_total NUMERIC(10,2) NOT NULL,
  upfront NUMERIC(10,2),
  installments SMALLINT,
  provider_ref TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  status incident_status DEFAULT 'open',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews
CREATE TABLE public.reviews (
  reservation_id UUID PRIMARY KEY REFERENCES public.reservations(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access controls
CREATE TABLE public.access_controls (
  id BIGSERIAL PRIMARY KEY,
  scope access_scope NOT NULL,
  rule access_rule NOT NULL,
  ip TEXT,
  country_code CHAR(2),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backup jobs
CREATE TABLE public.backup_jobs (
  id BIGSERIAL PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  status backup_status NOT NULL,
  location TEXT,
  details TEXT
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kyc_verifications_updated_at BEFORE UPDATE ON public.kyc_verifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);

-- RLS Policies for kyc_verifications
CREATE POLICY "Users can view own KYC" ON public.kyc_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own KYC" ON public.kyc_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own KYC" ON public.kyc_verifications FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins can view all KYC" ON public.kyc_verifications FOR SELECT USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);
CREATE POLICY "Admins can update all KYC" ON public.kyc_verifications FOR UPDATE USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);

-- RLS Policies for vehicles
CREATE POLICY "Anyone can view active vehicles" ON public.vehicles FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin_primary'));
CREATE POLICY "Owners can insert vehicles" ON public.vehicles FOR INSERT WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Owners can update own vehicles" ON public.vehicles FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners can delete own vehicles" ON public.vehicles FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all vehicles" ON public.vehicles FOR ALL USING (public.has_role(auth.uid(), 'admin_primary'));

-- RLS Policies for vehicle_photos
CREATE POLICY "Anyone can view photos of visible vehicles" ON public.vehicle_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = vehicle_photos.vehicle_id AND (vehicles.status = 'active' OR vehicles.owner_id = auth.uid()))
);
CREATE POLICY "Owners can manage own vehicle photos" ON public.vehicle_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = vehicle_photos.vehicle_id AND vehicles.owner_id = auth.uid())
);

-- RLS Policies for vehicle_availability
CREATE POLICY "Anyone can view availability of visible vehicles" ON public.vehicle_availability FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = vehicle_availability.vehicle_id AND (vehicles.status = 'active' OR vehicles.owner_id = auth.uid()))
);
CREATE POLICY "Owners can manage own vehicle availability" ON public.vehicle_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM public.vehicles WHERE vehicles.id = vehicle_availability.vehicle_id AND vehicles.owner_id = auth.uid())
);

-- RLS Policies for reservations
CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (
  auth.uid() = renter_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin_primary')
);
CREATE POLICY "Renters can create reservations" ON public.reservations FOR INSERT WITH CHECK (
  auth.uid() = renter_id AND public.has_role(auth.uid(), 'renter')
);
CREATE POLICY "Involved parties can update reservations" ON public.reservations FOR UPDATE USING (
  auth.uid() = renter_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin_primary')
);

-- RLS Policies for payments
CREATE POLICY "Users can view payments for own reservations" ON public.payments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = payments.reservation_id 
    AND (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin_primary')
);
CREATE POLICY "System can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin_primary'));

-- RLS Policies for incidents
CREATE POLICY "Users can view incidents for own reservations" ON public.incidents FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = incidents.reservation_id 
    AND (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin_primary')
);
CREATE POLICY "Users can create incidents for own reservations" ON public.incidents FOR INSERT WITH CHECK (
  auth.uid() = reporter_id AND EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = incidents.reservation_id 
    AND (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
  )
);
CREATE POLICY "Admins can update incidents" ON public.incidents FOR UPDATE USING (public.has_role(auth.uid(), 'admin_primary'));

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews for completed reservations" ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND EXISTS (
    SELECT 1 FROM public.reservations 
    WHERE reservations.id = reviews.reservation_id 
    AND (reservations.renter_id = auth.uid() OR reservations.owner_id = auth.uid())
    AND reservations.status = 'finished'
  )
);

-- RLS Policies for admin tables
CREATE POLICY "Only admins can view login attempts" ON public.login_attempts FOR SELECT USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);
CREATE POLICY "System can insert login attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Only security admins can manage access controls" ON public.access_controls FOR ALL USING (
  public.has_role(auth.uid(), 'admin_security')
);

CREATE POLICY "Only admins can view backups" ON public.backup_jobs FOR SELECT USING (
  public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security')
);
CREATE POLICY "System can manage backups" ON public.backup_jobs FOR ALL USING (true);

-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public) VALUES ('vehicle_photos', 'vehicle_photos', true);

-- Storage policies for vehicle_photos bucket
CREATE POLICY "Anyone can view vehicle photos" ON storage.objects FOR SELECT USING (bucket_id = 'vehicle_photos');
CREATE POLICY "Authenticated users can upload vehicle photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'vehicle_photos' AND auth.role() = 'authenticated'
);
CREATE POLICY "Users can update own vehicle photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'vehicle_photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own vehicle photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'vehicle_photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc_documents', 'kyc_documents', false);

-- Storage policies for kyc_documents bucket
CREATE POLICY "Users can view own KYC documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'kyc_documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all KYC documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'kyc_documents' AND (public.has_role(auth.uid(), 'admin_primary') OR public.has_role(auth.uid(), 'admin_security'))
);
CREATE POLICY "Users can upload own KYC documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'kyc_documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own KYC documents" ON storage.objects FOR UPDATE USING (
  bucket_id = 'kyc_documents' AND auth.uid()::text = (storage.foldername(name))[1]
);