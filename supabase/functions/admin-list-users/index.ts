import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
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
    )

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin_primary', 'admin_security'])

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List all users from auth
    const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    // Get all profiles
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('*')

    // Get all user roles
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role')

    // Get all KYC verifications
    const { data: kycData } = await supabaseAdmin
      .from('kyc_verifications')
      .select('user_id, status')

    // Create a map for quick lookups
    const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const rolesMap = new Map<string, string[]>()
    userRoles?.forEach(ur => {
      const existing = rolesMap.get(ur.user_id) || []
      rolesMap.set(ur.user_id, [...existing, ur.role])
    })
    const kycMap = new Map(kycData?.map(k => [k.user_id, k.status]) || [])

    // Sync missing profiles
    const missingProfiles = authUsers.users.filter(u => !profilesMap.has(u.id))
    
    if (missingProfiles.length > 0) {
      const newProfiles = missingProfiles.map(u => ({
        id: u.id,
        full_name: u.user_metadata?.full_name || null,
        phone: u.phone || null,
        created_at: u.created_at,
        updated_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert(newProfiles)

      if (!insertError) {
        // Add to map for response
        newProfiles.forEach(p => profilesMap.set(p.id, p))
      }
    }

    // Combine all data
    const usersWithData = authUsers.users.map(user => {
      const profile = profilesMap.get(user.id)
      const roles = rolesMap.get(user.id) || []
      const kycStatus = kycMap.get(user.id) || null

      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        full_name: profile?.full_name || user.user_metadata?.full_name || null,
        phone: profile?.phone || user.phone || null,
        roles: roles,
        kyc_status: kycStatus,
        email_confirmed: user.email_confirmed_at !== null
      }
    })

    return new Response(
      JSON.stringify({ users: usersWithData }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
