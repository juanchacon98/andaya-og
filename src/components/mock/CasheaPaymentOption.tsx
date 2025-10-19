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
  onApproved: () => void;
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
    onApproved();
  };

  const handleCancel = () => {
    setStep("option");
    setCedula("");
    setEmail("");
  };

  if (step === "option") {
    return (
      <Card className="border-2 border-[#FFD400] hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-[#FFD400]/10">
              <CreditCard className="h-8 w-8 text-[#FFD400]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Cashea</h3>
              <p className="text-sm text-muted-foreground">
                Pago inicial + 3 cuotas sin intereses (simulado)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
              <p className="text-sm font-medium text-foreground">Plan de pago:</p>
              <p className="text-xs text-muted-foreground">
                • Inicial: {formatBs(initialPayment)} (25%)
              </p>
              <p className="text-xs text-muted-foreground">
                • 3 cuotas de {formatBs(installment)} cada 7 días
              </p>
              <p className="text-xs text-muted-foreground font-semibold pt-1 border-t mt-2">
                Total: {formatBs(totalAmount)}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
                ⚠️ SIMULACIÓN PARA DEMO
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                Este proceso es una simulación. No se procesarán pagos reales.
              </p>
            </div>

            <Button
              onClick={handleSelectCashea}
              className="w-full bg-[#FFD400] hover:bg-[#FFD400]/90 text-black"
              size="lg"
            >
              Pagar con Cashea
            </Button>

            <a 
              href="https://tugruero.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-center text-muted-foreground hover:text-primary inline-flex items-center gap-1 justify-center w-full"
            >
              Conocer más sobre Cashea
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "form") {
    return (
      <Card className="border-2 border-[#FFD400]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[#FFD400]/10">
              <CreditCard className="h-6 w-6 text-[#FFD400]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Validar preaprobación</h3>
              <p className="text-sm text-muted-foreground">Ingresa tus datos para continuar</p>
            </div>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cashea te permite pagar el alquiler en 4 cuotas sin intereses.
            </p>

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
              <Button 
                type="submit" 
                className="flex-1 bg-[#FFD400] hover:bg-[#FFD400]/90 text-black"
              >
                Validar preaprobación
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground italic">
              Este proceso es una simulación. No se procesarán datos reales.
            </p>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (step === "validating") {
    return (
      <Card className="border-2 border-[#FFD400]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-[#FFD400]/10">
              <Loader2 className="h-12 w-12 text-[#FFD400] animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Validando información...
              </h3>
              <p className="text-sm text-muted-foreground">
                Verificando tu preaprobación con Cashea
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Este proceso puede tardar unos segundos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // step === "approved"
  return (
    <Card className="border-2 border-green-500">
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-full bg-green-500/10">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              ¡Preaprobado con Cashea!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tu solicitud de financiamiento ha sido preaprobada
            </p>

            <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-left">
              <p className="font-medium text-sm mb-2">Desglose de pagos:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pago inicial (hoy)</span>
                  <span className="font-semibold">{formatBs(initialPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 1 (7 días)</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 2 (14 días)</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuota 3 (21 días)</span>
                  <span className="font-semibold">{formatBs(installment)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatBs(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="text-xs text-left text-muted-foreground space-y-1 mt-4">
              <p>✓ Sin intereses ni comisiones adicionales</p>
              <p>✓ Débito automático cada 7 días</p>
              <p>✓ Puedes liquidar anticipadamente sin penalización</p>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Recibirás un correo con los detalles del pago
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
