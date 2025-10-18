import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, DollarSign, Clock, User, Car } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReservationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: any;
  isOwner: boolean;
}

export function ReservationDetailsDialog({ 
  open, 
  onOpenChange, 
  reservation,
  isOwner 
}: ReservationDetailsDialogProps) {
  if (!reservation) return null;

  const vehicle = reservation.vehicles;
  const otherParty = isOwner ? "Arrendatario" : "Propietario";

  const statusColors = {
    pending: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    cancelled: "bg-gray-500",
    finished: "bg-blue-500",
  };

  const statusLabels = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
    cancelled: "Cancelada",
    finished: "Finalizada",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de la Reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado</span>
            <Badge className={statusColors[reservation.status as keyof typeof statusColors]}>
              {statusLabels[reservation.status as keyof typeof statusLabels]}
            </Badge>
          </div>

          {/* Información del Vehículo */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Car className="h-5 w-5" />
              Información del Vehículo
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm text-muted-foreground">Vehículo</p>
                <p className="font-medium">{vehicle?.title || `${vehicle?.brand} ${vehicle?.model}`}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Marca y Modelo</p>
                <p className="font-medium">{vehicle?.brand} {vehicle?.model} {vehicle?.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ubicación
                </p>
                <p className="font-medium">{vehicle?.city || "No especificada"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{vehicle?.plate || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Fechas de la Reserva
            </h3>
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-secondary/50">
              <div>
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Inicio
                </p>
                <p className="font-medium">
                  {format(new Date(reservation.start_date), "PPP", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Devolución
                </p>
                <p className="font-medium">
                  {format(new Date(reservation.end_date), "PPP", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Costos */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Desglose de Costos
            </h3>
            <div className="space-y-2 p-4 rounded-lg bg-secondary/50">
              <div className="flex justify-between">
                <span className="text-sm">Precio diario</span>
                <span className="font-medium">Bs {reservation.daily_price?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Subtotal</span>
                <span className="font-medium">Bs {reservation.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tarifa de servicio</span>
                <span className="font-medium">Bs {reservation.service_fee?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">Bs {reservation.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Información del otro usuario */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              {otherParty}
            </h3>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">
                Información de contacto disponible una vez aprobada la reserva
              </p>
            </div>
          </div>

          {/* ID de Reserva */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              ID de reserva: {reservation.id}
            </p>
            <p className="text-xs text-muted-foreground">
              Creada el: {format(new Date(reservation.created_at), "PPP 'a las' p", { locale: es })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
