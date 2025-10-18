-- Actualizar default_provider a yadio en fx_settings
UPDATE public.fx_settings
SET default_provider = 'yadio'
WHERE default_provider = 'bcv';

-- Si no existe ningún registro en fx_settings, crear uno
INSERT INTO public.fx_settings (default_provider, default_currency, refresh_minutes, eur_usd_fallback_rate)
SELECT 'yadio', 'USD', 30, 1.10
WHERE NOT EXISTS (SELECT 1 FROM public.fx_settings);