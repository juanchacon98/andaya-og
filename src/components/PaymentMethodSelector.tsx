import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CasheaPaymentOption } from "@/components/mock/CasheaPaymentOption";
import { MercantilPaymentOption } from "@/components/mock/MercantilPaymentOption";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface PaymentMethodSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAmount: number;
  onPaymentComplete: (method: "cashea" | "mercantil") => void;
}

export function PaymentMethodSelector({
  open,
  onOpenChange,
  totalAmount,
  onPaymentComplete
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<"cashea" | "mercantil" | null>(null);
  const [confirmSimulation, setConfirmSimulation] = useState(false);

  const handleMethodSelect = (method: "cashea" | "mercantil") => {
    if (!confirmSimulation) {
      return;
    }
    setSelectedMethod(method);
  };

  const handlePaymentApproved = () => {
    if (selectedMethod) {
      onPaymentComplete(selectedMethod);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Selecciona método de pago</DialogTitle>
        </DialogHeader>

        <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-900 dark:text-blue-200">
            Este es un flujo de pago <strong>simulado para demostración</strong>. No se procesarán transacciones reales.
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2 p-4 rounded-lg bg-secondary/50">
          <Checkbox 
            id="confirm-simulation" 
            checked={confirmSimulation}
            onCheckedChange={(checked) => setConfirmSimulation(checked as boolean)}
          />
          <Label 
            htmlFor="confirm-simulation" 
            className="text-sm font-medium cursor-pointer"
          >
            Confirmo que este pago es una simulación para demo
          </Label>
        </div>

        {!selectedMethod ? (
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              onClick={() => handleMethodSelect("cashea")}
              className={`cursor-pointer transition-opacity ${!confirmSimulation ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <CasheaPaymentOption 
                totalAmount={totalAmount}
                onApproved={handlePaymentApproved}
              />
            </div>

            <div 
              onClick={() => handleMethodSelect("mercantil")}
              className={`cursor-pointer transition-opacity ${!confirmSimulation ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <MercantilPaymentOption 
                totalAmount={totalAmount}
                onApproved={handlePaymentApproved}
              />
            </div>
          </div>
        ) : (
          <div>
            {selectedMethod === "cashea" ? (
              <CasheaPaymentOption 
                totalAmount={totalAmount}
                onApproved={handlePaymentApproved}
              />
            ) : (
              <MercantilPaymentOption 
                totalAmount={totalAmount}
                onApproved={handlePaymentApproved}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
