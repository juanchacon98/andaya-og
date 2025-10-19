import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Auto-redirect after some time
    const timer = setTimeout(() => {
      // Uncomment if you want auto-redirect
      // navigate('/login');
    }, 10000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ¡Registro Exitoso!
          </CardTitle>
          <CardDescription className="text-base">
            Tu cuenta ha sido creada correctamente
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email verification notice */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Verifica tu correo electrónico
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
                </p>
              </div>
            </div>
          </div>

          {/* Next steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">
              Próximos pasos:
            </h4>
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                  1
                </span>
                <span>Revisa tu correo electrónico</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                  2
                </span>
                <span>Haz clic en el enlace de verificación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-semibold mt-0.5">
                  3
                </span>
                <span>Inicia sesión y comienza a rentar</span>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full gap-2"
              size="lg"
            >
              Ir al inicio de sesión
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            ¿No recibiste el correo?{" "}
            <button 
              className="text-primary hover:underline font-medium"
              onClick={() => {
                // TODO: Implement resend email functionality
                alert("Funcionalidad de reenvío próximamente");
              }}
            >
              Reenviar correo de verificación
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
