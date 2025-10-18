import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider') || 'bcv';
    const code = url.searchParams.get('code') || 'USD';

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    console.log(`Fetching latest rate for ${provider}:${code}`);

    // Obtener la tasa más reciente
    const { data: rate, error } = await supabaseClient
      .from('exchange_rates')
      .select('*')
      .eq('provider', provider)
      .eq('code', code)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !rate) {
      console.error('Rate not found:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Rate not found',
          provider,
          code
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Verificar si es stale (más de 24h)
    const fetchedAt = new Date(rate.fetched_at);
    const hoursSinceUpdate = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
    const isStale = hoursSinceUpdate > 24;

    // Si está muy desactualizado, disparar refresh en background (best effort)
    if (isStale) {
      console.log('Rate is stale, triggering background refresh');
      // No esperamos la respuesta
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/fx-refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        }
      }).catch(err => console.error('Background refresh failed:', err));
    }

    return new Response(
      JSON.stringify({
        rate: {
          provider: rate.provider,
          code: rate.code,
          buy: rate.buy,
          sell: rate.sell,
          value: rate.value,
          fetched_at: rate.fetched_at,
          source: rate.source
        },
        stale: isStale,
        hours_since_update: Math.round(hoursSinceUpdate * 10) / 10
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fx-latest:', error);
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