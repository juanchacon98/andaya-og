import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('user_id is required');
    }

    // Get user info
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user_id)
      .single();

    // Get all admin users
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin_primary', 'admin_security']);

    if (adminRoles && adminRoles.length > 0) {
      // Log the notification (you could expand this to send emails, push notifications, etc.)
      console.log(`New KYC submission from user ${user_id} (${profile?.full_name || 'Unknown'})`);
      console.log(`Admins to notify: ${adminRoles.map(r => r.user_id).join(', ')}`);

      // Insert audit log
      await supabase.from('audit_logs').insert({
        action: 'kyc_submitted',
        actor_id: user_id,
        entity_type: 'kyc_verification',
        entity_id: user_id,
        metadata: {
          user_name: profile?.full_name,
          notification_sent_to_admins: adminRoles.length
        }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admins notified',
        admin_count: adminRoles?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in notify-kyc-submission:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
