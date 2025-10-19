import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { formatBs } from "@/lib/currency";

interface RCVInsuranceOptionProps {
  onToggle: (enabled: boolean) => void;
  mockPrice?: number;
}

export function RCVInsuranceOption({ onToggle, mockPrice = 85 }: RCVInsuranceOptionProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsChecked(checked);
    
    if (checked) {
      setIsVerifying(true);
      // Simular verificación con aseguradora
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsVerifying(false);
      setIsVerified(true);
      onToggle(true);
    } else {
      setIsVerified(false);
      onToggle(false);
    }
  };

  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">Seguro RCV con Tu Gruero</p>
                  <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                    <span className="text-amber-800 dark:text-amber-200 text-xs">Simulación</span>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Activa tu cobertura RCV (Responsabilidad Civil Vehicular) validada por aseguradoras aliadas.
                </p>
              </div>
            </div>
            <p className="font-bold text-lg whitespace-nowrap">{formatBs(mockPrice)}</p>
          </div>

          {/* Checkbox de activación */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="rcv-insurance" 
              checked={isChecked}
              onCheckedChange={handleToggle}
              disabled={isVerifying}
            />
            <label
              htmlFor="rcv-insurance"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Activar seguro RCV por {formatBs(mockPrice)}
            </label>
          </div>

          {/* Estado de verificación */}
          {isVerifying && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Verificando con aseguradora...
              </p>
            </div>
          )}

          {isVerified && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ Aprobado - Cobertura RCV activa
              </p>
            </div>
          )}

          {/* Detalles del servicio */}
          <div className="rounded-lg border p-3 space-y-2 bg-muted/50 text-xs">
            <p className="font-medium">Cobertura incluida:</p>
            <ul className="space-y-1 text-muted-foreground ml-4">
              <li>• Daños a terceros hasta Bs 50,000</li>
              <li>• Lesiones corporales</li>
              <li>• Asistencia legal básica</li>
            </ul>
            <div className="pt-2 border-t">
              <p className="text-muted-foreground">
                Tu Gruero actúa como canal alternativo de RCV aprobado por aseguradoras venezolanas.
              </p>
              <a 
                href="https://tugruero.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Conocer más sobre Tu Gruero
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Nota de transparencia */}
          <p className="text-xs text-center text-muted-foreground italic">
            Este paso es una simulación para fines demostrativos.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
