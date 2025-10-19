import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CloseReservationRequest {
  reservation_id: string;
  actual_return_at: string; // ISO timestamp
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

    const { reservation_id, actual_return_at }: CloseReservationRequest = await req.json();

    console.log("Close reservation request:", { reservation_id, actual_return_at });

    if (!reservation_id || !actual_return_at) {
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
          price_bs
        ),
        renter:profiles!reservations_renter_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        owner:profiles!reservations_owner_id_fkey (
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

    const actualReturnDate = new Date(actual_return_at);
    const plannedEndDate = new Date(reservation.end_at);
    const graceEndDate = new Date(plannedEndDate.getTime() + (reservation.grace_minutes || 30) * 60000);

    // Calculate overage
    let overageHours = 0;
    let lateFees = 0;

    if (actualReturnDate > graceEndDate) {
      // Calculate hours past grace period (round to nearest 0.5 hour)
      const overageMs = actualReturnDate.getTime() - graceEndDate.getTime();
      overageHours = Math.ceil((overageMs / (1000 * 60 * 60)) * 2) / 2;
      
      // Calculate late fee
      const lateFeeRate = reservation.late_fee_per_hour_bs || (reservation.hourly_rate_bs * 1.2);
      lateFees = Math.round(lateFeeRate * overageHours * 100) / 100;
    }

    // Calculate final total
    const subtotal = reservation.total_price_bs || reservation.subtotal || 0;
    const finalTotal = subtotal + lateFees;

    // Update reservation
    const { error: updateError } = await supabaseClient
      .from("reservations")
      .update({
        status: "completed",
        overage_hours: overageHours,
        final_total_bs: finalTotal,
        closed_at: new Date().toISOString(),
      })
      .eq("id", reservation_id);

    if (updateError) {
      throw new Error("Failed to update reservation");
    }

    // Create close event
    await supabaseClient.from("reservation_events").insert({
      reservation_id,
      type: "closed",
      meta: {
        actual_return_at,
        planned_end_at: reservation.end_at,
        grace_end_at: graceEndDate.toISOString(),
        overage_hours: overageHours,
        late_fees_bs: lateFees,
        final_total_bs: finalTotal,
      },
    });

    // Send receipt emails
    const formatBs = (value: number) => {
      return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    };

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Recibo Final de Reserva</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Reserva completada</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">${reservation.vehicle.brand} ${reservation.vehicle.model} ${reservation.vehicle.year}</h2>
            
            <div style="margin: 15px 0;">
              <strong style="color: #666;">Subtotal de alquiler:</strong><br>
              <span style="font-size: 18px;">Bs ${formatBs(subtotal)}</span>
            </div>
            
            ${overageHours > 0 ? `
            <div style="margin: 15px 0; padding: 15px; background: #fef3c7; border-radius: 6px;">
              <strong style="color: #92400e;">Retraso (${overageHours}h pasado el período de gracia):</strong><br>
              <span style="font-size: 18px; color: #b45309;">Bs ${formatBs(lateFees)}</span>
            </div>
            ` : ''}
            
            <div style="margin: 15px 0; padding-top: 15px; border-top: 2px solid #e0e0e0;">
              <strong style="color: #666;">Total Final:</strong><br>
              <span style="font-size: 28px; color: #667eea; font-weight: bold;">Bs ${formatBs(finalTotal)}</span>
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            Gracias por usar AndaYa. Este es tu recibo final.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send to renter
    try {
      await resend.emails.send({
        from: "AndaYa <onboarding@resend.dev>",
        to: [reservation.renter.email],
        subject: `Recibo final — ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
        html: receiptHtml,
      });
    } catch (emailError) {
      console.error("Failed to send renter email:", emailError);
    }

    // Send to owner
    try {
      await resend.emails.send({
        from: "AndaYa <onboarding@resend.dev>",
        to: [reservation.owner.email],
        subject: `Reserva completada — ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
        html: receiptHtml,
      });
    } catch (emailError) {
      console.error("Failed to send owner email:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        overage_hours: overageHours,
        late_fees_bs: lateFees,
        final_total_bs: finalTotal,
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
    console.error("Error in close-reservation function:", error);
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
