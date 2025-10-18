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
    
    // Cliente con el token del usuario para verificar permisos
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

    const { user_id, roles, reason } = await req.json();

    if (!user_id || !Array.isArray(roles)) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cliente con Service Role para operaciones administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Eliminar roles actuales
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);

    // Insertar nuevos roles
    if (roles.length > 0) {
      const rolesToInsert = roles.map(role => ({
        user_id,
        role
      }));

      await supabaseAdmin
        .from('user_roles')
        .insert(rolesToInsert);
    }

    // Registrar en audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'update_user_roles',
        entity_type: 'user',
        entity_id: user_id,
        metadata: { roles, reason }
      });

    console.log(`Roles actualizados para usuario ${user_id}:`, roles);

    return new Response(
      JSON.stringify({ success: true, roles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error en admin-set-role:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
