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

    const { user_id, reason } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener email del usuario
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (!userData.user) {
      throw new Error('Usuario no encontrado');
    }

    // Generar link de reset de contraseña
    const { data: resetData } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email!,
    });

    // Registrar en audit log
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'force_password_reset',
        entity_type: 'user',
        entity_id: user_id,
        metadata: { email: userData.user.email, reason }
      });

    console.log(`Reset de contraseña enviado a ${userData.user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email de reset enviado',
        reset_link: resetData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error en admin-reset-password:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
