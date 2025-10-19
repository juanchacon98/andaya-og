import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    handleAuthCallback();
  }, []);

  const handleAuthCallback = async () => {
    try {
      // Get the hash from URL (contains access_token, refresh_token, etc.)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const type = hashParams.get("type");

      console.log("Auth callback type:", type);

      // If we have tokens in the URL, verify the session
      if (accessToken) {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          throw new Error("Error al verificar la sesión");
        }

        if (session) {
          console.log("Session verified successfully");
          setStatus("success");
          
          toast.success("Email verificado correctamente", {
            description: "Tu cuenta ha sido activada",
          });

          // Redirect to profile after a short delay
          setTimeout(() => {
            navigate("/perfil");
          }, 2000);
        } else {
          throw new Error("No se pudo establecer la sesión");
        }
      } else {
        // No tokens in URL - might be already logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log("Already authenticated");
          navigate("/perfil");
        } else {
          throw new Error("No se encontraron credenciales de autenticación");
        }
      }
    } catch (error: any) {
      console.error("Auth callback error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Error al confirmar el email");
      
      toast.error("Error en la confirmación", {
        description: error.message || "No se pudo verificar tu email",
      });
    }
  };

  const handleResendConfirmation = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: "", // User needs to provide email
      });

      if (error) throw error;

      toast.success("Email de confirmación reenviado");
    } catch (error) {
      toast.error("Error al reenviar confirmación");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            {status === "loading" && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Verificando tu email..."}
            {status === "success" && "¡Email Verificado!"}
            {status === "error" && "Error de Verificación"}
          </CardTitle>
          
          <CardDescription>
            {status === "loading" && "Por favor espera mientras confirmamos tu cuenta"}
            {status === "success" && "Tu cuenta ha sido activada exitosamente. Redirigiendo..."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>

        {status === "error" && (
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate("/login")}
                variant="default"
                className="w-full"
              >
                Ir a Iniciar Sesión
              </Button>
              
              <Button
                onClick={() => navigate("/registro")}
                variant="outline"
                className="w-full"
              >
                Crear Nueva Cuenta
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                ¿No recibiste el email de confirmación?
              </p>
              <Button
                onClick={handleResendConfirmation}
                variant="link"
                className="text-primary"
              >
                Reenviar confirmación
              </Button>
            </div>
          </CardContent>
        )}

        {status === "success" && (
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Serás redirigido a tu perfil en unos segundos...
              </p>
              <Button
                onClick={() => navigate("/perfil")}
                variant="default"
                className="w-full"
              >
                Ir a Mi Perfil
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
