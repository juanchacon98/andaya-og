import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reservation_id, method, amount_bs } = await req.json();

    console.log('Fallback payment simulation:', { reservation_id, method, user_id: user.id });

    if (!reservation_id || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch reservation
    const { data: reservation, error: resError } = await supabaseClient
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the renter
    if (reservation.renter_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify approved
    if (reservation.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Reservation must be approved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalAmount = amount_bs || reservation.final_total_bs || reservation.total_price_bs || reservation.total || 0;

    // Insert payment
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        reservation_id,
        amount_total: totalAmount,
        upfront: method === 'cashea' ? Math.round(totalAmount * 0.25) : totalAmount,
        installments: method === 'cashea' ? 3 : 0,
        method: method === 'cashea' ? 'cashea_sim' : 'full',
        status: 'paid',
        currency: 'Bs',
        provider_ref: `FALLBACK-${method.toUpperCase()}-${Date.now()}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update reservation
    const { error: updateError } = await supabaseClient
      .from('reservations')
      .update({ 
        payment_status: 'simulated'
      })
      .eq('id', reservation_id);

    if (updateError) {
      console.error('Update error:', updateError);
    }

    // Audit log
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'payment_simulated_fallback',
        actor_id: user.id,
        entity_id: reservation_id,
        entity_type: 'reservation',
        metadata: {
          payment_id: payment.id,
          method,
          amount: totalAmount,
          simulated: true,
          fallback: true,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        payment,
        message: 'Payment simulated (fallback)',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Fallback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
