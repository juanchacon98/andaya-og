import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ImpersonationBannerProps {
  userName: string;
  expiresAt: string;
}

export function ImpersonationBanner({ userName, expiresAt }: ImpersonationBannerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        handleExit();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleExit = async () => {
    if (!user?.id) return;
    
    try {
      // Revoke the impersonation session
      const { error } = await supabase
        .from('impersonation_sessions')
        .update({ revoked_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('revoked_at', null);
      
      if (error) {
        console.error('Error revoking impersonation:', error);
      }
      
      // Clear impersonation data from storage
      localStorage.removeItem('__impersonate');
      sessionStorage.removeItem('__impersonate');
      
      // Use local scope for safe logout
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error('Error in handleExit:', error);
    }
    
    // Force redirect to admin users page
    window.location.href = '/admin/usuarios';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          <div className="text-sm">
            <strong>Modo Impersonación:</strong> Estás viendo como {userName}
            <span className="ml-3 font-mono">Expira en {timeLeft}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExit}
          className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>
    </div>
  );
}
