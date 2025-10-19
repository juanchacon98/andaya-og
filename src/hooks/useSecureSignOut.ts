import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useSecureSignOut() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    try {
      // Attempt local sign out (scope: 'local' is safe from browser)
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      if (error) {
        console.warn('Supabase signOut failed, performing manual cleanup:', error);
        // Fallback: manual cleanup
        await manualCleanup();
      } else {
        // Success: still perform cleanup for good measure
        await cleanup();
      }
      
      toast.success('Sesión cerrada');
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Error during sign out:', err);
      // Network error or other issue: force cleanup
      await manualCleanup();
      toast.success('Sesión cerrada');
      navigate('/login', { replace: true });
    }
  };

  const cleanup = async () => {
    // Clear React Query cache
    queryClient.clear();
    
    // Clear any realtime subscriptions
    supabase.removeAllChannels();
  };

  const manualCleanup = async () => {
    // Clear all auth storage
    const storageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    storageKeys.forEach(key => localStorage.removeItem(key));
    
    const sessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith('sb-') || key.includes('supabase')
    );
    sessionKeys.forEach(key => sessionStorage.removeItem(key));
    
    // Clear impersonation data
    localStorage.removeItem('__impersonate');
    sessionStorage.removeItem('__impersonate');
    
    await cleanup();
  };

  return { signOut };
}
