import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DolarAPIResponse {
  nombre: string;
  compra: number;
  venta: number;
  promedio: number;
  fechaActualizacion: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Obtener configuración
    const { data: settings } = await supabaseClient
      .from('fx_settings')
      .select('*')
      .single();

    const refreshMinutes = settings?.refresh_minutes || 30;

    console.log('Fetching exchange rates from ve.dolarapi.com...');

    // Obtener datos del API
    const response = await fetch('https://ve.dolarapi.com/v1/dolares');
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: DolarAPIResponse[] = await response.json();
    console.log('Received data:', data);

    let inserted = 0;
    const codes: string[] = [];

    // Procesar cada proveedor
    for (const item of data) {
      const provider = item.nombre.toLowerCase().replace(/\s+/g, '_');
      
      // Verificar si ya existe un registro reciente
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - refreshMinutes);

      const { data: existing } = await supabaseClient
        .from('exchange_rates')
        .select('id')
        .eq('provider', provider)
        .eq('code', 'USD')
        .gte('fetched_at', cutoffTime.toISOString())
        .single();

      if (existing) {
        console.log(`Skipping ${provider} - recent data exists`);
        continue;
      }

      // Insertar tasa USD
      const { error: usdError } = await supabaseClient
        .from('exchange_rates')
        .insert({
          provider,
          code: 'USD',
          buy: item.compra,
          sell: item.venta,
          value: item.promedio,
          source: item,
          fetched_at: item.fechaActualizacion
        });

      if (usdError) {
        console.error(`Error inserting ${provider} USD:`, usdError);
      } else {
        inserted++;
        codes.push(`${provider}:USD`);
      }

      // Calcular EUR derivado
      const eurUsdRate = settings?.eur_usd_fallback_rate || 1.10;
      const eurValue = item.promedio * eurUsdRate;

      const { error: eurError } = await supabaseClient
        .from('exchange_rates')
        .insert({
          provider,
          code: 'EUR',
          buy: item.compra ? item.compra * eurUsdRate : null,
          sell: item.venta ? item.venta * eurUsdRate : null,
          value: eurValue,
          source: {
            ...item,
            derived: true,
            eur_usd_rate: eurUsdRate,
            note: 'Calculated from USD rate'
          },
          fetched_at: item.fechaActualizacion
        });

      if (eurError) {
        console.error(`Error inserting ${provider} EUR:`, eurError);
      } else {
        inserted++;
        codes.push(`${provider}:EUR`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        codes,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fx-refresh:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});