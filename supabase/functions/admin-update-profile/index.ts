import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el usuario es admin
    const { data: adminRoles } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = adminRoles?.some(r => 
      r.role === 'admin_primary' || r.role === 'admin_security'
    );

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, profilePatch } = await req.json();

    if (!user_id || !profilePatch) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Actualizar perfil
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({
        ...profilePatch,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Registrar en audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'update_user_profile',
        entity_type: 'user',
        entity_id: user_id,
        metadata: { changes: Object.keys(profilePatch) }
      });

    console.log(`Perfil actualizado para usuario ${user_id}`);

    return new Response(
      JSON.stringify({ success: true, profile: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error en admin-update-profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
