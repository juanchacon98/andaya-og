import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  impersonationData: { userName: string; expiresAt: string } | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  impersonationData: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonationData, setImpersonationData] = useState<{ userName: string; expiresAt: string } | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check if this is an impersonation session
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: impersonationSession } = await supabase
                .from('impersonation_sessions')
                .select('expires_at, admin_id')
                .eq('user_id', session.user.id)
                .is('revoked_at', null)
                .gte('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
              
              if (impersonationSession) {
                // Get user profile for display name
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', session.user.id)
                  .single();
                
                setImpersonationData({
                  userName: profile?.full_name || session.user.email || 'Usuario',
                  expiresAt: impersonationSession.expires_at
                });
              } else {
                setImpersonationData(null);
              }
            } catch (error) {
              console.error('Error checking impersonation:', error);
              setImpersonationData(null);
            }
          }, 0);
        } else {
          setImpersonationData(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check if this is an impersonation session
      if (session?.user) {
        try {
          const { data: impersonationSession } = await supabase
            .from('impersonation_sessions')
            .select('expires_at, admin_id')
            .eq('user_id', session.user.id)
            .is('revoked_at', null)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (impersonationSession) {
            // Get user profile for display name
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.user.id)
              .single();
            
            setImpersonationData({
              userName: profile?.full_name || session.user.email || 'Usuario',
              expiresAt: impersonationSession.expires_at
            });
          }
        } catch (error) {
          console.error('Error checking impersonation:', error);
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, impersonationData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
