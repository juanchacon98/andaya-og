import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get JWT from request
    const authHeader = req.headers.get('Authorization')!;
    const jwt = authHeader.replace('Bearer ', '');

    // Verify caller is admin
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: adminRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .in('role', ['admin_primary', 'admin_security']);

    if (roleError || !adminRoles || adminRoles.length === 0) {
      console.error('Not an admin:', caller.id);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { user_id, reason, duration_minutes = 15 } = await req.json();

    if (!user_id || !reason) {
      return new Response(JSON.stringify({ error: 'user_id and reason are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check target user exists
    const { data: targetUser, error: targetError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (targetError || !targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create temporary session for target user
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + duration_minutes);

    // Get client IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Record impersonation session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('impersonation_sessions')
      .insert({
        admin_id: caller.id,
        user_id: user_id,
        reason: reason,
        expires_at: expiresAt.toISOString(),
        ip_address: ip
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Failed to create impersonation session:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate temporary JWT for target user with correct redirect URL
    const { data: tokenData, error: tokenError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.user.email!,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://e3b2816f-485f-4cdf-9dc3-b86a29adbeba.lovableproject.com'}/`
      }
    });

    if (tokenError || !tokenData) {
      console.error('Failed to generate impersonation token:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Record in audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'impersonate_user',
      entity_type: 'user',
      entity_id: user_id,
      metadata: {
        reason,
        duration_minutes,
        session_id: session.id,
        ip_address: ip
      }
    });

    console.log(`Admin ${caller.email} impersonating user ${targetUser.user.email} (reason: ${reason})`);

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      magic_link: tokenData.properties.action_link,
      expires_at: expiresAt.toISOString(),
      user: {
        id: targetUser.user.id,
        email: targetUser.user.email,
        full_name: targetUser.user.user_metadata?.full_name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in admin-impersonate:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
