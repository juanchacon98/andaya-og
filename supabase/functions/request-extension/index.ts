import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ExtensionRequest {
  reservation_id: string;
  new_end_at: string; // ISO timestamp
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { reservation_id, new_end_at }: ExtensionRequest = await req.json();

    console.log("Extension request:", { reservation_id, new_end_at, user_id: user.id });

    // Validate inputs
    if (!reservation_id || !new_end_at) {
      throw new Error("Missing required fields");
    }

    // Get reservation details
    const { data: reservation, error: reservationError } = await supabaseClient
      .from("reservations")
      .select(`
        *,
        vehicle:vehicles (
          id,
          brand,
          model,
          year,
          price_bs,
          owner_id
        ),
        renter:profiles!reservations_renter_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", reservation_id)
      .single();

    if (reservationError || !reservation) {
      throw new Error("Reservation not found");
    }

    // Verify user is the renter
    if (reservation.renter_id !== user.id) {
      throw new Error("Unauthorized: not your reservation");
    }

    // Verify reservation is active
    if (reservation.status !== "active" && reservation.status !== "approved") {
      throw new Error("Reservation must be active to request extension");
    }

    const newEndDate = new Date(new_end_at);
    const currentEndDate = new Date(reservation.end_at);

    // Validate new end time is after current end time
    if (newEndDate <= currentEndDate) {
      throw new Error("New end time must be after current end time");
    }

    // Check for conflicts with other reservations
    const { data: conflicts, error: conflictError } = await supabaseClient
      .from("reservations")
      .select("id")
      .eq("vehicle_id", reservation.vehicle_id)
      .neq("id", reservation_id)
      .in("status", ["approved", "active"])
      .or(`start_at.lte.${new_end_at},end_at.gte.${reservation.end_at}`);

    if (conflictError) {
      throw new Error("Error checking availability");
    }

    if (conflicts && conflicts.length > 0) {
      throw new Error("Vehicle not available for the requested extension period");
    }

    // Calculate extension pricing
    const { data: extensionPricing, error: pricingError } = await supabaseClient
      .rpc("calculate_reservation_pricing", {
        p_vehicle_id: reservation.vehicle_id,
        p_start_at: reservation.end_at,
        p_end_at: new_end_at,
      });

    if (pricingError) {
      throw new Error("Failed to calculate extension pricing");
    }

    // Create extension request event
    const { error: eventError } = await supabaseClient
      .from("reservation_events")
      .insert({
        reservation_id,
        type: "extension_requested",
        created_by: user.id,
        meta: {
          current_end_at: reservation.end_at,
          requested_end_at: new_end_at,
          extension_pricing: extensionPricing,
        },
      });

    if (eventError) {
      console.error("Failed to create event:", eventError);
    }

    // Get owner details for notification
    const { data: owner, error: ownerError } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name, email, phone")
      .eq("id", reservation.vehicle.owner_id)
      .single();

    if (!ownerError && owner) {
      // Send email notification to owner
      const currentEnd = new Date(reservation.end_at).toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const newEnd = newEndDate.toLocaleString('es-VE', {
        timeZone: 'America/Caracas',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const extensionCost = new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(extensionPricing.subtotal_bs);

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Solicitud de Extensión</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hola ${owner.first_name},</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              ${reservation.renter.first_name} ${reservation.renter.last_name} solicita extender su reserva:
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin-top: 0; color: #f59e0b; font-size: 20px;">${reservation.vehicle.brand} ${reservation.vehicle.model} ${reservation.vehicle.year}</h2>
              
              <div style="margin: 15px 0;">
                <strong style="color: #666;">Devolución actual:</strong><br>
                <span style="font-size: 16px;">${currentEnd}</span>
              </div>
              
              <div style="margin: 15px 0;">
                <strong style="color: #666;">Nueva devolución solicitada:</strong><br>
                <span style="font-size: 16px; color: #f59e0b; font-weight: bold;">${newEnd}</span>
              </div>
              
              <div style="margin: 15px 0; padding-top: 15px; border-top: 2px solid #e0e0e0;">
                <strong style="color: #666;">Costo adicional:</strong><br>
                <span style="font-size: 24px; color: #10b981; font-weight: bold;">Bs ${extensionCost}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/owner/reservas" 
                 style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 5px; font-size: 16px;">
                Ver y Responder
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              Este correo fue enviado por AndaYa. Por favor responde lo antes posible.
            </p>
          </div>
        </body>
        </html>
      `;

      try {
        await resend.emails.send({
          from: "AndaYa <onboarding@resend.dev>",
          to: [owner.email],
          subject: `Solicitud de extensión — ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
          html: emailHtml,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Extension request created successfully",
        extension_pricing: extensionPricing,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in request-extension function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
