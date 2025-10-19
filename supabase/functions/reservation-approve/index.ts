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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reservation_id } = await req.json();

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: 'reservation_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Approving reservation:', reservation_id, 'by user:', user.id);

    // Verificar que el usuario es el dueño del vehículo
    const { data: reservation, error: resError } = await supabaseClient
      .from('reservations')
      .select(`
        *,
        vehicle:vehicles!reservations_vehicle_id_fkey (
          owner_id,
          brand,
          model
        ),
        renter:profiles!reservations_renter_id_fkey (
          full_name,
          id
        )
      `)
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) {
      console.error('Reservation fetch error:', resError);
      return new Response(
        JSON.stringify({ error: 'Reserva no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reservation.vehicle.owner_id !== user.id) {
      console.error('User is not owner. Owner:', reservation.vehicle.owner_id, 'User:', user.id);
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para aprobar esta reserva' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Actualizar reserva a approved
    const { data: updated, error: updateError } = await supabaseClient
      .from('reservations')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reservation_id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error al aprobar la reserva: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Reservation approved successfully:', updated);

    // TODO: Enviar email al arrendatario notificando aprobación
    // Llamar a edge function de email o usar Resend aquí

    return new Response(
      JSON.stringify({ 
        success: true, 
        reservation: updated,
        message: 'Reserva aprobada exitosamente'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});