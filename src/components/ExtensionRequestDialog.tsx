import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { formatBs } from "@/lib/currency";

dayjs.extend(utc);
dayjs.extend(timezone);

interface ExtensionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: {
    id: string;
    end_at: string;
    vehicle_id: string;
    vehicle: {
      brand: string;
      model: string;
      year: number;
    };
  };
  onSuccess?: () => void;
}

export function ExtensionRequestDialog({
  open,
  onOpenChange,
  reservation,
  onSuccess,
}: ExtensionRequestDialogProps) {
  const [additionalHours, setAdditionalHours] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState<any>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);

  const currentEndAt = dayjs.tz(reservation.end_at, "America/Caracas");
  const newEndAt = currentEndAt.add(additionalHours, "hours");

  const handleCalculatePrice = async (hours: number) => {
    setAdditionalHours(hours);
    setLoadingPricing(true);
    
    try {
      const newEnd = currentEndAt.add(hours, "hours").toISOString();
      
      const { data, error } = await supabase.functions.invoke("pricing-quote", {
        body: {
          vehicle_id: reservation.vehicle_id,
          start_at: reservation.end_at,
          end_at: newEnd,
        },
      });

      if (error) throw error;

      setPricing(data.pricing);
    } catch (error) {
      console.error("Error calculating pricing:", error);
      toast.error("Error al calcular el precio");
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Debes iniciar sesión");
        return;
      }

      const { data, error } = await supabase.functions.invoke("request-extension", {
        body: {
          reservation_id: reservation.id,
          new_end_at: newEndAt.toISOString(),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast.success("Solicitud de extensión enviada al dueño");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error requesting extension:", error);
      toast.error(error.message || "Error al solicitar extensión");
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing when dialog opens
  useState(() => {
    if (open) {
      handleCalculatePrice(additionalHours);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Extender Reserva</DialogTitle>
          <DialogDescription>
            Solicita más tiempo para {reservation.vehicle.brand} {reservation.vehicle.model} {reservation.vehicle.year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current end time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Devolución actual</Label>
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {currentEndAt.format("D [de] MMMM, YYYY [a las] HH:mm")}
              </span>
            </div>
          </div>

          {/* Additional hours selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Horas adicionales</Label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 4, 8].map((hours) => (
                <Button
                  key={hours}
                  type="button"
                  variant={additionalHours === hours ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCalculatePrice(hours)}
                  disabled={loadingPricing}
                >
                  {hours}h
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={additionalHours === 24 ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => handleCalculatePrice(24)}
                disabled={loadingPricing}
              >
                1 día
              </Button>
            </div>
          </div>

          {/* New end time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nueva devolución</Label>
            <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {newEndAt.format("D [de] MMMM, YYYY [a las] HH:mm")}
              </span>
            </div>
          </div>

          {/* Pricing */}
          {pricing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Costo adicional</Label>
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {pricing.pricing_mode === "hourly"
                      ? `${pricing.breakdown.hours}h × ${formatBs(pricing.hourly_rate_bs)}/h`
                      : pricing.pricing_mode === "daily"
                      ? `${pricing.breakdown.days} día(s) × ${formatBs(pricing.daily_rate_bs)}`
                      : "Días + Horas"}
                  </span>
                  <span className="font-medium">{formatBs(pricing.subtotal_bs)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between">
                  <span className="font-semibold">Total adicional</span>
                  <span className="text-xl font-bold text-primary">
                    {formatBs(pricing.subtotal_bs)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200">
              El dueño debe aprobar esta extensión. Te notificaremos de su respuesta por email.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || loadingPricing || !pricing}
          >
            {loading ? "Enviando..." : "Solicitar Extensión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
