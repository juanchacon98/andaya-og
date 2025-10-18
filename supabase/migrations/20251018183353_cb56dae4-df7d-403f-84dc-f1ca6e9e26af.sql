-- Tabla de tasas de cambio
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  code TEXT NOT NULL,
  buy NUMERIC(18,6),
  sell NUMERIC(18,6),
  value NUMERIC(18,6) NOT NULL,
  source JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda eficiente
CREATE INDEX idx_exchange_rates_provider_code ON public.exchange_rates(provider, code);
CREATE INDEX idx_exchange_rates_fetched_at ON public.exchange_rates(fetched_at DESC);
CREATE INDEX idx_exchange_rates_provider_code_fetched ON public.exchange_rates(provider, code, fetched_at DESC);

-- RLS: SELECT público, escritura solo admin
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exchange rates"
ON public.exchange_rates FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage rates"
ON public.exchange_rates FOR ALL
USING (has_role(auth.uid(), 'admin_primary'::app_role) OR has_role(auth.uid(), 'admin_security'::app_role));

-- Tabla de configuración FX (una sola fila)
CREATE TABLE IF NOT EXISTS public.fx_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_provider TEXT NOT NULL DEFAULT 'bcv',
  default_currency TEXT NOT NULL DEFAULT 'USD',
  refresh_minutes INTEGER NOT NULL DEFAULT 30,
  eur_usd_fallback_rate NUMERIC(18,6) DEFAULT 1.10,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insertar configuración por defecto
INSERT INTO public.fx_settings (default_provider, default_currency, refresh_minutes)
VALUES ('bcv', 'USD', 30)
ON CONFLICT DO NOTHING;

-- RLS para fx_settings
ALTER TABLE public.fx_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fx settings"
ON public.fx_settings FOR SELECT
USING (true);

CREATE POLICY "Only admins can update fx settings"
ON public.fx_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin_primary'::app_role) OR has_role(auth.uid(), 'admin_security'::app_role));

-- Trigger para actualizar updated_at en fx_settings
CREATE TRIGGER update_fx_settings_updated_at
BEFORE UPDATE ON public.fx_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar campos de preferencia FX a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS preferred_provider TEXT DEFAULT 'bcv';

-- Constraint para valores válidos
ALTER TABLE public.profiles
ADD CONSTRAINT check_preferred_currency CHECK (preferred_currency IN ('USD', 'EUR')),
ADD CONSTRAINT check_preferred_provider CHECK (preferred_provider IN ('bcv', 'paralelo', 'monitor'));