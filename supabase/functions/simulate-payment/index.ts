import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reservation_id, method } = await req.json();

    console.log('Processing simulated payment:', { reservation_id, method, user_id: user.id });

    // Validate input
    if (!reservation_id || !method) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: reservation_id and method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['cashea', 'mercantil'].includes(method)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method. Must be cashea or mercantil' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch reservation
    const { data: reservation, error: reservationError } = await supabaseClient
      .from('reservations')
      .select(`
        *,
        vehicles!reservations_vehicle_id_fkey (
          id, brand, model, title
        ),
        owner:profiles!reservations_owner_id_fkey (
          id, full_name, email:id
        ),
        renter:profiles!reservations_renter_id_fkey (
          id, full_name, email:id
        )
      `)
      .eq('id', reservation_id)
      .single();

    if (reservationError || !reservation) {
      console.error('Reservation fetch error:', reservationError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is the renter
    if (reservation.renter_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You are not authorized to pay for this reservation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify reservation is approved
    if (reservation.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Reservation must be approved before payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already paid
    const { data: existingPayment } = await supabaseClient
      .from('payments')
      .select('id')
      .eq('reservation_id', reservation_id)
      .single();

    if (existingPayment) {
      return new Response(
        JSON.stringify({ error: 'This reservation has already been paid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalAmount = reservation.final_total_bs || reservation.total_price_bs || reservation.total || 0;
    
    // Calculate installments for Cashea (25% upfront, 3 installments)
    const upfront = method === 'cashea' ? Math.round(totalAmount * 0.25) : totalAmount;
    const installments = method === 'cashea' ? 3 : 0;

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        reservation_id,
        amount_total: totalAmount,
        upfront,
        installments,
        method: method === 'cashea' ? 'cashea_sim' : 'full',
        status: 'paid',
        currency: 'Bs',
        provider_ref: `SIM-${method.toUpperCase()}-${Date.now()}`,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update reservation payment_status only
    const { error: updateError } = await supabaseClient
      .from('reservations')
      .update({ 
        payment_status: 'simulated'
      })
      .eq('id', reservation_id);

    if (updateError) {
      console.error('Reservation update error:', updateError);
    }

    // Log audit entry
    const { error: auditError } = await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'payment_simulated',
        actor_id: user.id,
        entity_id: reservation_id,
        entity_type: 'reservation',
        metadata: {
          payment_id: payment.id,
          method,
          amount: totalAmount,
          simulated: true,
        },
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    // Get user emails for notifications
    const { data: ownerUser } = await supabaseClient.auth.admin.getUserById(reservation.owner_id);
    const { data: renterUser } = await supabaseClient.auth.admin.getUserById(reservation.renter_id);

    // TODO: Send transactional emails
    // This would require configuring email service (Resend, etc.)
    console.log('Email notifications should be sent to:', {
      owner: ownerUser?.user?.email,
      renter: renterUser?.user?.email,
    });

    return new Response(
      JSON.stringify({
        success: true,
        payment,
        message: 'Payment simulated successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in simulate-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
