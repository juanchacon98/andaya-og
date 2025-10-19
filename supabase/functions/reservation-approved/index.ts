import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReservationApprovedPayload {
  reservation_id: string;
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

    const { reservation_id }: ReservationApprovedPayload = await req.json();

    console.log("Processing reservation-approved for:", reservation_id);

    // Obtener datos de la reserva con información del vehículo, arrendatario y dueño
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
        renter:profiles!reservations_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", reservation_id)
      .single();

    if (reservationError || !reservation) {
      throw new Error(`Reservation not found: ${reservationError?.message}`);
    }

    // Obtener datos del dueño (para WhatsApp)
    const { data: owner, error: ownerError } = await supabaseClient
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .eq("id", reservation.vehicle.owner_id)
      .single();

    if (ownerError || !owner) {
      throw new Error(`Owner not found: ${ownerError?.message}`);
    }

    // Formatear fechas
    const startDate = new Date(reservation.start_date).toLocaleDateString('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const endDate = new Date(reservation.end_date).toLocaleDateString('es-VE', {
      timeZone: 'America/Caracas',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Formatear precio
    const totalBs = new Intl.NumberFormat('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(reservation.total_price_bs);

    // Normalizar teléfono para WhatsApp (formato internacional sin +)
    let whatsappPhone = "";
    if (owner.phone) {
      whatsappPhone = owner.phone.replace(/\D/g, ""); // Eliminar no dígitos
      if (!whatsappPhone.startsWith("58")) {
        whatsappPhone = "58" + whatsappPhone; // Agregar código de país VE
      }
    }

    const whatsappButton = whatsappPhone
      ? `
        <div style="text-align: center; margin: 20px 0;">
          <a href="https://wa.me/${whatsappPhone}?text=Hola%20${owner.first_name},%20tengo%20una%20pregunta%20sobre%20mi%20reserva%20${reservation_id}" 
             style="display: inline-block; background: #25D366; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            💬 Contactar por WhatsApp
          </a>
        </div>
      `
      : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎉 ¡Tu reserva fue aprobada!</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hola ${reservation.renter.first_name},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">¡Excelentes noticias! Tu reserva ha sido aprobada por el dueño del vehículo.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #10b981; font-size: 20px;">${reservation.vehicle.brand} ${reservation.vehicle.model} ${reservation.vehicle.year}</h2>
            
            <div style="margin: 15px 0;">
              <strong style="color: #666;">Retiro:</strong><br>
              <span style="font-size: 16px;">${startDate}</span>
            </div>
            
            <div style="margin: 15px 0;">
              <strong style="color: #666;">Devolución:</strong><br>
              <span style="font-size: 16px;">${endDate}</span>
            </div>
            
            <div style="margin: 15px 0; padding-top: 15px; border-top: 2px solid #e0e0e0;">
              <strong style="color: #666;">Total a pagar:</strong><br>
              <span style="font-size: 24px; color: #10b981; font-weight: bold;">Bs ${totalBs}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || ''}/reservas/${reservation_id}" 
               style="display: inline-block; background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Ver detalles de la reserva
            </a>
          </div>
          
          ${whatsappButton}
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>Próximos pasos:</strong><br>
              • Coordina con el dueño los detalles de retiro${whatsappPhone ? " (puedes usar WhatsApp)" : ""}<br>
              • Asegúrate de tener tu documentación lista<br>
              • Revisa las condiciones del vehículo al recibirlo
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            ¡Disfruta tu viaje! 🚗<br>
            El equipo de AndaYa
          </p>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "AndaYa <onboarding@resend.dev>",
      to: [reservation.renter.email],
      subject: `¡Reserva aprobada! — ${reservation.vehicle.brand} ${reservation.vehicle.model}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Guardar log
    await supabaseClient.from("email_logs").insert({
      user_id: reservation.renter.id,
      type: "reservation_approved",
      sent_at: new Date().toISOString(),
      status: "sent",
      metadata: {
        reservation_id,
        email_id: emailResponse.id,
      },
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in reservation-approved function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
