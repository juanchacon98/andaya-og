import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YadioRate {
  rate: number;
  timestamp: number;
}

interface YadioResponse {
  base: string;
  [key: string]: string | number | YadioRate;
}

interface BCVResponse {
  currency: string;
  price: number;
  last_update: string;
}

async function fetchFromYadio(): Promise<{ usd?: number; eur?: number } | null> {
  try {
    console.log('Fetching from Yadio API...');
    const response = await fetch('https://api.yadio.io/exrates/VES');
    if (!response.ok) {
      console.error('Yadio API error:', response.status);
      return null;
    }
    const data: YadioResponse = await response.json();
    
    const usd = typeof data.USD === 'object' && 'rate' in data.USD ? data.USD.rate : null;
    const eur = typeof data.EUR === 'object' && 'rate' in data.EUR ? data.EUR.rate : null;
    
    if (!usd) return null;
    
    return { usd, eur: eur || undefined };
  } catch (error) {
    console.error('Error fetching from Yadio:', error);
    return null;
  }
}

async function fetchFromBCV(): Promise<number | null> {
  try {
    console.log('Fetching from BCV API (fallback)...');
    const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv');
    if (!response.ok) {
      console.error('BCV API error:', response.status);
      return null;
    }
    const data: BCVResponse = await response.json();
    return data.price || null;
  } catch (error) {
    console.error('Error fetching from BCV:', error);
    return null;
  }
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

    const { data: settings } = await supabaseClient
      .from('fx_settings')
      .select('*')
      .single();

    const refreshMinutes = settings?.refresh_minutes || 30;
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - refreshMinutes);

    let inserted = 0;
    const codes: string[] = [];
    let providerUsed = 'none';

    // Intentar Yadio primero
    const yadioRates = await fetchFromYadio();
    
    if (yadioRates && yadioRates.usd) {
      providerUsed = 'yadio';
      
      // Verificar si ya existe registro reciente de Yadio USD
      const { data: existingUsd } = await supabaseClient
        .from('exchange_rates')
        .select('id')
        .eq('provider', 'yadio')
        .eq('code', 'USD')
        .gte('fetched_at', cutoffTime.toISOString())
        .single();

      if (!existingUsd) {
        const { error: usdError } = await supabaseClient
          .from('exchange_rates')
          .insert({
            provider: 'yadio',
            code: 'USD',
            value: yadioRates.usd,
            source: { api: 'yadio', rate: yadioRates.usd },
            fetched_at: new Date().toISOString()
          });

        if (!usdError) {
          inserted++;
          codes.push('yadio:USD');
        } else {
          console.error('Error inserting Yadio USD:', usdError);
        }
      }

      // Insertar EUR si está disponible
      if (yadioRates.eur) {
        const { data: existingEur } = await supabaseClient
          .from('exchange_rates')
          .select('id')
          .eq('provider', 'yadio')
          .eq('code', 'EUR')
          .gte('fetched_at', cutoffTime.toISOString())
          .single();

        if (!existingEur) {
          const { error: eurError } = await supabaseClient
            .from('exchange_rates')
            .insert({
              provider: 'yadio',
              code: 'EUR',
              value: yadioRates.eur,
              source: { api: 'yadio', rate: yadioRates.eur },
              fetched_at: new Date().toISOString()
            });

          if (!eurError) {
            inserted++;
            codes.push('yadio:EUR');
          } else {
            console.error('Error inserting Yadio EUR:', eurError);
          }
        }
      }
    }

    // Fallback a BCV si Yadio falló
    if (!yadioRates || !yadioRates.usd) {
      console.log('Yadio failed, using BCV fallback...');
      const bcvRate = await fetchFromBCV();
      
      if (bcvRate) {
        providerUsed = 'bcv';
        
        const { data: existingBcv } = await supabaseClient
          .from('exchange_rates')
          .select('id')
          .eq('provider', 'bcv')
          .eq('code', 'USD')
          .gte('fetched_at', cutoffTime.toISOString())
          .single();

        if (!existingBcv) {
          const { error: bcvError } = await supabaseClient
            .from('exchange_rates')
            .insert({
              provider: 'bcv',
              code: 'USD',
              value: bcvRate,
              source: { api: 'bcv', price: bcvRate },
              fetched_at: new Date().toISOString()
            });

          if (!bcvError) {
            inserted++;
            codes.push('bcv:USD');
          } else {
            console.error('Error inserting BCV USD:', bcvError);
          }

          // Calcular EUR derivado
          const eurUsdRate = settings?.eur_usd_fallback_rate || 1.10;
          const eurValue = bcvRate * eurUsdRate;

          const { error: eurError } = await supabaseClient
            .from('exchange_rates')
            .insert({
              provider: 'bcv',
              code: 'EUR',
              value: eurValue,
              source: { 
                api: 'bcv',
                derived: true,
                eur_usd_rate: eurUsdRate,
                base_usd_rate: bcvRate
              },
              fetched_at: new Date().toISOString()
            });

          if (!eurError) {
            inserted++;
            codes.push('bcv:EUR');
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        provider_used: providerUsed,
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