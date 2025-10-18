import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModifyReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  onSuccess: () => void;
}

export function ModifyReservationDialog({ 
  open, 
  onOpenChange, 
  reservation,
  onSuccess 
}: ModifyReservationDialogProps) {
  const [startDate, setStartDate] = useState<Date>(new Date(reservation?.start_date));
  const [endDate, setEndDate] = useState<Date>(new Date(reservation?.end_date));
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotal = () => {
    if (!startDate || !endDate || !reservation) return { days: 0, subtotal: 0, serviceFee: 0, total: 0 };
    
    const days = differenceInDays(endDate, startDate);
    const subtotal = days * (reservation.daily_price || 0);
    const serviceFee = subtotal * 0.10;
    const total = subtotal + serviceFee;
    
    return { days, subtotal, serviceFee, total };
  };

  const handleModify = async () => {
    if (!startDate || !endDate) {
      toast.error("Por favor selecciona ambas fechas");
      return;
    }

    setIsLoading(true);
    
    try {
      const { days, subtotal, serviceFee, total } = calculateTotal();
      
      const { error } = await supabase
        .from("reservations")
        .update({
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          subtotal,
          service_fee: serviceFee,
          total,
          status: "pending" // Cambiar a pendiente para que el propietario apruebe
        })
        .eq("id", reservation.id);

      if (error) throw error;

      toast.success("Reserva modificada exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error modifying reservation:", error);
      toast.error("Error al modificar la reserva: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { days, subtotal, serviceFee, total } = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de inicio</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha de devolución</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP", { locale: es }) : "Selecciona una fecha"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  disabled={(date) => date < (startDate || new Date())}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {startDate && endDate && days > 0 && (
            <div className="space-y-2 rounded-lg border p-4 bg-secondary/50">
              <div className="flex justify-between text-sm">
                <span>Bs {reservation?.daily_price?.toLocaleString()} × {days} días</span>
                <span>Bs {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tarifa de servicio (10%)</span>
                <span>Bs {serviceFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>Bs {total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            La modificación de la reserva requerirá nueva aprobación del propietario.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleModify} disabled={isLoading}>
            {isLoading ? "Modificando..." : "Confirmar Modificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
