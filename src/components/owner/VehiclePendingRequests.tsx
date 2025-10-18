import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, MessageCircle, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PendingReservation {
  id: string;
  start_date: string;
  end_date: string;
  total: number;
  created_at: string;
  renter_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface VehiclePendingRequestsProps {
  vehicleId: string;
  vehicleTitle: string;
  reservations: PendingReservation[];
  onUpdate: () => void;
}

export const VehiclePendingRequests = ({
  vehicleId,
  vehicleTitle,
  reservations,
  onUpdate,
}: VehiclePendingRequestsProps) => {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Fecha no válida";
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch {
      return "Fecha no válida";
    }
  };

  const handleApprove = async (reservationId: string) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ status: "approved" })
        .eq("id", reservationId);

      if (error) throw error;

      toast.success("Reserva aprobada exitosamente");
      onUpdate();
    } catch (error: any) {
      console.error("Error approving reservation:", error);
      toast.error("Error al aprobar la reserva: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (reservationId: string) => {
    setSelectedReservation(reservationId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedReservation) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("reservations")
        .update({ 
          status: "cancelled",
          // Note: You may want to add a rejection_reason column to the reservations table
        })
        .eq("id", selectedReservation);

      if (error) throw error;

      toast.success("Reserva rechazada");
      setRejectDialogOpen(false);
      setSelectedReservation(null);
      setRejectionReason("");
      onUpdate();
    } catch (error: any) {
      console.error("Error rejecting reservation:", error);
      toast.error("Error al rechazar la reserva: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-muted-foreground">
          No hay solicitudes pendientes
        </p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Solicitante</TableHead>
            <TableHead>Fechas</TableHead>
            <TableHead>Días</TableHead>
            <TableHead className="text-right">Monto</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => {
            const days = differenceInDays(
              new Date(reservation.end_date),
              new Date(reservation.start_date)
            );

            return (
              <TableRow key={reservation.id}>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">
                      {reservation.profiles?.full_name || "Cliente"}
                    </p>
                    {reservation.profiles?.phone ? (
                      <a
                        href={`https://wa.me/${reservation.profiles.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="h-3 w-3" />
                        Contactar
                      </a>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Sin contacto
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {formatDate(reservation.start_date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      hasta {formatDate(reservation.end_date)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {days} día{days !== 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  Bs {reservation.total.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(reservation.id)}
                      disabled={isProcessing}
                      className="gap-1"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectClick(reservation.id)}
                      disabled={isProcessing}
                      className="gap-1"
                    >
                      <XCircle className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas rechazar esta solicitud? Puedes incluir un motivo opcional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Textarea
                id="reason"
                placeholder="Ej: El vehículo estará en mantenimiento durante esas fechas"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? "Procesando..." : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
