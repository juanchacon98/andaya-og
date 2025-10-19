import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function YummyIntegrationBanner() {
  const [isRequested, setIsRequested] = useState(false);

  const handleConnect = () => {
    setIsRequested(true);
    toast.success("Solicitud enviada a Yummy", {
      description: "Simulación: Tu solicitud de conexión fue procesada."
    });
    
    // Abrir link de Yummy después del toast
    setTimeout(() => {
      window.open("https://www.yummy.com.ve/", "_blank");
    }, 500);
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Genera ingresos con Yummy Rides</h3>
              </div>
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <span className="text-amber-800 dark:text-amber-200 text-xs">Integración aspiracional</span>
              </Badge>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            🚀 ¿Te gustaría generar ingresos adicionales con tu auto? 
            Inscríbete como conductor en Yummy Rides y comienza a manejar cuando quieras.
          </p>

          <div className="rounded-lg border p-3 space-y-2 bg-background/50">
            <p className="text-sm font-medium">Beneficios de ser conductor Yummy:</p>
            <ul className="space-y-1 text-xs text-muted-foreground ml-4">
              <li>• Gana dinero en tus tiempos libres</li>
              <li>• Horarios flexibles, tú decides cuándo trabajar</li>
              <li>• Pagos semanales directos a tu cuenta</li>
              <li>• Soporte 24/7 para conductores</li>
            </ul>
          </div>

          {!isRequested ? (
            <Button onClick={handleConnect} className="w-full" size="lg">
              <ExternalLink className="mr-2 h-4 w-4" />
              Conectarme con Yummy
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Solicitud enviada
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Tu solicitud de conexión con Yummy fue procesada exitosamente.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => window.open("https://www.yummy.com.ve/", "_blank")}
                variant="outline" 
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visitar Yummy.com.ve
              </Button>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground italic">
            (Simulación para propósito de demostración)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
