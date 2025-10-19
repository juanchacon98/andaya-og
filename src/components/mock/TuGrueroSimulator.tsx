import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Phone, Truck, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface TuGrueroSimulatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleInfo?: {
    brand: string;
    model: string;
    plate?: string;
  };
}

type SimulationStep = "initial" | "connecting" | "locating" | "confirmed" | "dispatched";

export function TuGrueroSimulator({ open, onOpenChange, vehicleInfo }: TuGrueroSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("initial");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleRequestAssistance = async () => {
    setStep("connecting");
    
    // Simular conexión
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep("locating");
    
    // Simular obtención de ubicación
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Mock location si falla
          setLocation({ lat: 10.4806, lng: -66.9036 }); // Caracas
        }
      );
    } else {
      setLocation({ lat: 10.4806, lng: -66.9036 });
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep("confirmed");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setStep("dispatched");
    
    toast.success("Asistencia en camino");
  };

  const handleClose = () => {
    setStep("initial");
    setLocation(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Asistencia en Ruta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badge de simulación */}
          <Badge variant="outline" className="w-full justify-center py-2 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <span className="text-amber-800 dark:text-amber-200">🎬 Simulación Demostrativa</span>
          </Badge>

          {/* Información del vehículo */}
          {vehicleInfo && (
            <div className="rounded-lg border p-3 bg-secondary/50">
              <p className="text-sm font-medium">Vehículo:</p>
              <p className="text-sm text-muted-foreground">
                {vehicleInfo.brand} {vehicleInfo.model}
                {vehicleInfo.plate && ` • ${vehicleInfo.plate}`}
              </p>
            </div>
          )}

          {/* Estados de simulación */}
          {step === "initial" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Solicita una grúa o asistencia en carretera las 24 horas del día.
              </p>
              <Button onClick={handleRequestAssistance} className="w-full" size="lg">
                🚗 Solicitar asistencia
              </Button>
            </div>
          )}

          {step === "connecting" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Conectando con Tu Gruero...</p>
            </div>
          )}

          {step === "locating" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <MapPin className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">Confirmando tu ubicación...</p>
              {location && (
                <p className="text-xs text-muted-foreground">
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {step === "confirmed" && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
              <p className="text-sm font-medium text-center">
                ✅ Ubicación confirmada
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Asignando grúa más cercana...
              </p>
            </div>
          )}

          {step === "dispatched" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <Truck className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Grúa en camino
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tiempo estimado de llegada: <strong>35 minutos</strong>
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Servicio 24/7 disponible para miembros AndaYa
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Contacto de emergencia:</p>
                </div>
                <p className="text-sm text-muted-foreground">0800-GRUERO (478376)</p>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open("https://tugruero.com", "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visitar tugruero.com
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Tu Gruero ofrece cobertura ilimitada con tiempo de respuesta promedio de 35 min en todo el país.
              </p>
            </div>
          )}

          {/* Info sobre el servicio real */}
          {step === "initial" && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/50">
              <p className="text-xs font-medium">Acerca de Tu Gruero:</p>
              <p className="text-xs text-muted-foreground">
                Tu Gruero es un servicio de asistencia vial 24/7 con cobertura nacional. 
                Este simulador muestra cómo funcionaría la integración con AndaYa.
              </p>
              <a 
                href="https://tugruero.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Conocer planes reales
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
