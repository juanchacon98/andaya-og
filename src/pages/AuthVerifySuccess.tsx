import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AuthVerifySuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect después de 3 segundos
    const timeout = setTimeout(() => {
      navigate('/perfil', { replace: true });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12 mt-14 sm:mt-16">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-6 pb-8 text-center space-y-6">
            {/* Icon de éxito */}
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/20 p-4">
                <CheckCircle2 
                  className="h-14 w-14 text-emerald-600 dark:text-emerald-400" 
                  aria-hidden="true" 
                />
              </div>
            </div>
            
            {/* Título */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                ¡Verificación exitosa!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Tu correo electrónico ha sido confirmado correctamente.
              </p>
            </div>
            
            {/* Mensaje informativo */}
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Te redirigiremos a tu perfil en unos segundos...
            </p>
            
            {/* Botón de acción */}
            <div className="pt-2">
              <Button 
                onClick={() => navigate('/perfil', { replace: true })} 
                className="w-full min-h-[44px]"
                size="lg"
              >
                Ir a mi perfil ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
