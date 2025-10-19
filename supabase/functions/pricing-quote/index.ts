import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PricingQuoteRequest {
  vehicle_id: string;
  start_at: string; // ISO timestamp
  end_at: string; // ISO timestamp
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { vehicle_id, start_at, end_at }: PricingQuoteRequest = await req.json();

    console.log("Pricing quote request:", { vehicle_id, start_at, end_at });

    // Validate inputs
    if (!vehicle_id || !start_at || !end_at) {
      throw new Error("Missing required fields: vehicle_id, start_at, end_at");
    }

    const startDate = new Date(start_at);
    const endDate = new Date(end_at);

    if (endDate <= startDate) {
      throw new Error("end_at must be after start_at");
    }

    // Check if vehicle exists and is active
    const { data: vehicle, error: vehicleError } = await supabaseClient
      .from("vehicles")
      .select("id, price_bs, status")
      .eq("id", vehicle_id)
      .eq("status", "active")
      .single();

    if (vehicleError || !vehicle) {
      throw new Error("Vehicle not found or not active");
    }

    // Calculate pricing using database function
    const { data: pricingData, error: pricingError } = await supabaseClient
      .rpc("calculate_reservation_pricing", {
        p_vehicle_id: vehicle_id,
        p_start_at: start_at,
        p_end_at: end_at,
      });

    if (pricingError) {
      console.error("Pricing calculation error:", pricingError);
      throw new Error(`Pricing calculation failed: ${pricingError.message}`);
    }

    console.log("Pricing calculated:", pricingData);

    return new Response(
      JSON.stringify({
        success: true,
        pricing: pricingData,
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
    console.error("Error in pricing-quote function:", error);
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
