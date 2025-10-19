import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";
import { formatBs } from "@/lib/currency";

interface CasheaPaymentOptionProps {
  totalAmount: number;
  onApproved: (approved: boolean) => void;
}

type CasheaStep = "option" | "form" | "validating" | "approved";

export function CasheaPaymentOption({ totalAmount, onApproved }: CasheaPaymentOptionProps) {
  const [step, setStep] = useState<CasheaStep>("option");
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");

  const initialPayment = totalAmount * 0.25; // 25% inicial
  const installment = (totalAmount - initialPayment) / 3;

  const handleSelectCashea = () => {
    setStep("form");
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cedula || !email) return;
    
    setStep("validating");
    
    // Simular validación de preaprobación
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setStep("approved");
    onApproved(true);
  };

  const handleCancel = () => {
    setStep("option");
    setCedula("");
    setEmail("");
    onApproved(false);
  };

  return (
    <Card className="border-2">
      <CardContent className="p-4">
        {step === "option" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold">Pagar con Cashea</p>
                  <p className="text-xs text-muted-foreground">Inicial + 3 cuotas sin intereses</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <span className="text-amber-800 dark:text-amber-200 text-xs">Demo</span>
              </Badge>
            </div>

            <div className="rounded-lg border p-3 space-y-1 bg-secondary/50">
              <p className="text-sm font-medium">Plan de pago:</p>
              <p className="text-xs text-muted-foreground">
                • Inicial: {formatBs(initialPayment)}
              </p>
              <p className="text-xs text-muted-foreground">
                • 3 cuotas de {formatBs(installment)} cada 7 días
              </p>
            </div>

            <Button onClick={handleSelectCashea} variant="outline" className="w-full">
              💜 Continuar con Cashea
            </Button>
          </div>
        )}

        {step === "form" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Validar preaprobación</p>
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                <span className="text-amber-800 dark:text-amber-200 text-xs">Simulación</span>
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              Cashea te permite pagar el alquiler en 4 cuotas sin intereses.
            </p>

            <form onSubmit={handleValidate} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula de identidad</Label>
                <Input
                  id="cedula"
                  placeholder="V-12345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Validar preaprobación
                </Button>
              </div>
            </form>

            <p className="text-xs text-center text-muted-foreground italic">
              Este proceso es una simulación. No se procesarán datos reales.
            </p>
          </div>
        )}

        {step === "validating" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Validando información con Cashea...</p>
            <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos</p>
          </div>
        )}

        {step === "approved" && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    ✅ Preaprobado con Cashea
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tu solicitud de financiamiento ha sido preaprobada.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3 bg-secondary/50">
              <p className="font-medium">Desglose de pagos:</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago inicial (hoy):</span>
                  <span className="font-semibold">{formatBs(initialPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 1 (en 7 días):</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 2 (en 14 días):</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 3 (en 21 días):</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold">
                  <span>Total:</span>
                  <span>{formatBs(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Sin intereses ni comisiones adicionales</p>
              <p>• Débito automático cada 7 días</p>
              <p>• Puedes liquidar anticipadamente sin penalización</p>
            </div>

            <a 
              href="https://tugruero.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Conocer más sobre Cashea
              <ExternalLink className="h-3 w-3" />
            </a>

            <Button onClick={handleCancel} variant="outline" className="w-full">
              Usar otro método de pago
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
