import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  vehicleId: string;
  reason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { vehicleId, reason }: NotificationRequest = await req.json();

    console.log('Processing vehicle rejection notification:', { vehicleId });

    // Get vehicle and owner information
    const { data: vehicle, error: vehicleError } = await supabaseClient
      .from('vehicles')
      .select(`
        *,
        owner:owner_id (
          id,
          raw_user_meta_data
        )
      `)
      .eq('id', vehicleId)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Error fetching vehicle:', vehicleError);
      return new Response(
        JSON.stringify({ error: 'Vehicle not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ownerEmail = vehicle.owner?.raw_user_meta_data?.email;
    const ownerName = vehicle.owner?.raw_user_meta_data?.full_name || 'Propietario';

    console.log('Notifying owner:', { ownerEmail, vehicleTitle: vehicle.title });

    // Here you would integrate with email service (Resend, SendGrid, etc.)
    // For now, we'll create an audit log entry
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'vehicle_rejected',
        actor_id: vehicle.owner_id,
        entity_type: 'vehicle',
        entity_id: vehicleId,
        metadata: {
          vehicle_title: vehicle.title,
          rejection_reason: reason,
          owner_email: ownerEmail,
          notified_at: new Date().toISOString(),
        }
      });

    // TODO: Integrate with email service when RESEND_API_KEY is configured
    // Example:
    // await resend.emails.send({
    //   from: "AndaYa <noreply@andaya.com>",
    //   to: [ownerEmail],
    //   subject: "Tu vehículo no fue aprobado",
    //   html: `
    //     <h1>Hola ${ownerName},</h1>
    //     <p>Lamentamos informarte que tu vehículo "${vehicle.title}" no ha sido aprobado.</p>
    //     <p><strong>Motivo:</strong> ${reason}</p>
    //     <p>Por favor, revisa la información y vuelve a intentarlo.</p>
    //   `
    // });

    console.log('Notification logged successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification logged. Email integration pending.',
        audit_logged: true 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in notify-vehicle-rejection:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);