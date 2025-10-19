import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";
import { formatBs } from "@/lib/currency";

interface MercantilPaymentOptionProps {
  totalAmount: number;
  onApproved: () => void;
}

type MercantilStep = "option" | "form" | "validating" | "approved";

export function MercantilPaymentOption({ totalAmount, onApproved }: MercantilPaymentOptionProps) {
  const [step, setStep] = useState<MercantilStep>("option");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  const handleSelectMercantil = () => {
    setStep("form");
  };

  const handleConfirmTransfer = async () => {
    setStep("validating");
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    setStep("approved");
    onApproved();
  };

  const handleCancel = () => {
    setStep("option");
    setAccountNumber("");
    setAccountHolder("");
  };

  if (step === "option") {
    return (
      <Card className="border-2 border-[#0D529E] hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-[#0D529E]/10">
              <Building2 className="h-8 w-8 text-[#0D529E]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">Banco Mercantil</h3>
              <p className="text-sm text-muted-foreground">
                Transferencia bancaria • Confirmación inmediata (simulado)
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monto a pagar</span>
                <span className="text-xl font-bold text-foreground">{formatBs(totalAmount)}</span>
              </div>
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
              onClick={handleSelectMercantil}
              className="w-full bg-[#0D529E] hover:bg-[#0D529E]/90 text-white"
              size="lg"
            >
              Pagar con Mercantil / Transferir
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Banco Mercantil C.A. • Banco Universal
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "form") {
    return (
      <Card className="border-2 border-[#0D529E]">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[#0D529E]/10">
              <Building2 className="h-6 w-6 text-[#0D529E]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Transferencia Mercantil</h3>
              <p className="text-sm text-muted-foreground">Ingresa los datos de la transferencia</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <p className="text-sm font-medium text-foreground">Datos de la cuenta destino:</p>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Titular:</span> AndaYa C.A.
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Banco:</span> Mercantil
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Cuenta:</span> 0105-XXXX-XXXX-XXXX-XXXX
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">RIF:</span> J-XXXXXXXX-X
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
              <p className="text-xs text-amber-900 dark:text-amber-200">
                Completa la transferencia desde tu banca en línea o móvil antes de continuar
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="account">Número de cuenta origen</Label>
                <Input
                  id="account"
                  placeholder="0105-XXXX-XXXX-XXXX-XXXX"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="holder">Titular de la cuenta</Label>
                <Input
                  id="holder"
                  placeholder="Tu nombre completo"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monto a confirmar</span>
                  <span className="text-xl font-bold text-foreground">{formatBs(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmTransfer}
                disabled={!accountNumber || !accountHolder}
                className="flex-1 bg-[#0D529E] hover:bg-[#0D529E]/90 text-white"
              >
                Confirmar transferencia
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "validating") {
    return (
      <Card className="border-2 border-[#0D529E]">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-[#0D529E]/10">
              <Loader2 className="h-12 w-12 text-[#0D529E] animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Validando transferencia...
              </h3>
              <p className="text-sm text-muted-foreground">
                Verificando los datos con Banco Mercantil
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
              ¡Pago confirmado!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tu transferencia ha sido verificada exitosamente
            </p>

            <div className="p-4 rounded-lg bg-secondary/50 space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Método</span>
                <span className="text-sm font-medium">Transferencia Mercantil</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Monto pagado</span>
                <span className="text-sm font-bold">{formatBs(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <span className="text-sm font-medium text-green-600">Confirmado</span>
              </div>
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
