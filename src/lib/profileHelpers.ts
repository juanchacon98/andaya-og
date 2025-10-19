import { supabase } from "@/integrations/supabase/client";

/**
 * Fetches profile data with automatic fallback to profiles table if v_profiles_basic view doesn't exist
 */
export async function fetchProfileWithFallback(userId: string) {
  // Try v_profiles_basic first
  let result = await supabase
    .from('v_profiles_basic' as any)
    .select('id, full_name, phone, kyc_status')
    .eq('id', userId)
    .maybeSingle();
  
  // Fallback to profiles if view doesn't exist (PGRST205 error)
  if (result.error && (result.error as any).code === 'PGRST205') {
    result = await supabase
      .from('profiles')
      .select('id, full_name, phone, kyc_status')
      .eq('id', userId)
      .maybeSingle();
  }
  
  return result;
}
