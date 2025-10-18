import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface VehicleRejectDialogProps {
  vehicleId: string | null;
  vehicleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VehicleRejectDialog({ 
  vehicleId, 
  vehicleName, 
  open, 
  onOpenChange, 
  onSuccess 
}: VehicleRejectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleReject = async () => {
    if (!vehicleId) return;
    if (!reason.trim()) {
      toast.error("Debes proporcionar un motivo de rechazo");
      return;
    }

    setLoading(true);
    try {
      // Actualizar estado del vehículo
      const { error } = await supabase
        .from("vehicles")
        .update({ 
          status: "rejected",
          // Nota: Necesitarías agregar un campo rejection_reason a la tabla
          // Por ahora solo cambiamos el estado
        })
        .eq("id", vehicleId);

      if (error) throw error;

      // Notify vehicle owner
      try {
        await supabase.functions.invoke('notify-vehicle-rejection', {
          body: { vehicleId, reason }
        });
      } catch (notifyError: any) {
        console.error('Error sending notification:', notifyError);
        // Continue anyway - rejection was successful
      }

      toast.success("Vehículo rechazado. Se notificará al propietario.");
      onSuccess();
      onOpenChange(false);
      setReason("");
    } catch (error: any) {
      console.error("Error rejecting vehicle:", error);
      toast.error("Error al rechazar vehículo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Vehículo</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres rechazar "{vehicleName}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del rechazo *</Label>
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explica por qué este vehículo no cumple con los requisitos..."
              required
            />
            <p className="text-sm text-muted-foreground">
              Este motivo será enviado al propietario del vehículo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={loading || !reason.trim()}
          >
            {loading ? "Rechazando..." : "Rechazar vehículo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
