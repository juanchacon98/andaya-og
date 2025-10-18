import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  User,
  Phone,
  DollarSign,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total: number;
  daily_price: number;
  created_at: string;
  renter_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface VehicleReservationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleTitle: string;
}

export const VehicleReservationsDialog = ({
  open,
  onOpenChange,
  vehicleId,
  vehicleTitle,
}: VehicleReservationsDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (open && vehicleId) {
      fetchReservations();
    }
  }, [open, vehicleId]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          id,
          start_date,
          end_date,
          status,
          total,
          daily_price,
          created_at,
          renter_id
        `)
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately for each renter
      const reservationsWithProfiles = await Promise.all(
        (data || []).map(async (reservation) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", reservation.renter_id)
            .single();

          return {
            ...reservation,
            profiles: profile || undefined,
          };
        })
      );

      setReservations(reservationsWithProfiles);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Error al cargar las reservas");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      pending: {
        label: "Pendiente",
        variant: "secondary",
        icon: Clock,
      },
      approved: {
        label: "Aprobada",
        variant: "default",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelada",
        variant: "destructive",
        icon: XCircle,
      },
      finished: {
        label: "Finalizada",
        variant: "outline",
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleContactRenter = (phone: string, renterName: string) => {
    if (!phone) {
      toast.error("No se encontró información de contacto");
      return;
    }

    const phoneNumber = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${renterName}, te contacto respecto a tu reserva del vehículo ${vehicleTitle}.`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Fecha no válida";
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return "Fecha no válida";
    }
  };

  const filterReservations = (status: string | null) => {
    if (!status) return reservations;
    return reservations.filter((r) => r.status === status);
  };

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {reservation.profiles?.full_name || "Nombre no disponible"}
            </span>
          </div>
          {reservation.profiles?.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{reservation.profiles.phone}</span>
            </div>
          )}
        </div>
        {getStatusBadge(reservation.status)}
      </div>

      <Separator />

      <div className="grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Inicio: </span>
            <span>{formatDate(reservation.start_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Fin: </span>
            <span>{formatDate(reservation.end_date)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Total: </span>
            <span className="text-primary font-semibold">
              Bs {reservation.total.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            Reservado el {formatDate(reservation.created_at)}
          </span>
        </div>
      </div>

      {reservation.profiles?.phone && (
        <>
          <Separator />
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() =>
              handleContactRenter(
                reservation.profiles!.phone,
                reservation.profiles!.full_name
              )
            }
          >
            <MessageCircle className="h-4 w-4" />
            Contactar por WhatsApp
          </Button>
        </>
      )}
    </Card>
  );

  const ReservationsList = ({ reservations }: { reservations: Reservation[] }) => {
    if (reservations.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No hay reservas en esta categoría</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {reservations.map((reservation) => (
          <ReservationCard key={reservation.id} reservation={reservation} />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Reservas del Vehículo</DialogTitle>
          <DialogDescription>{vehicleTitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando reservas...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                Todas
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {reservations.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pendientes
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filterReservations("pending").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprobadas
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filterReservations("approved").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="finished">
                Finalizadas
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filterReservations("finished").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Canceladas
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {filterReservations("cancelled").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4 pr-4">
              <TabsContent value="all" className="mt-0">
                <ReservationsList reservations={reservations} />
              </TabsContent>

              <TabsContent value="pending" className="mt-0">
                <ReservationsList reservations={filterReservations("pending")} />
              </TabsContent>

              <TabsContent value="approved" className="mt-0">
                <ReservationsList reservations={filterReservations("approved")} />
              </TabsContent>

              <TabsContent value="finished" className="mt-0">
                <ReservationsList reservations={filterReservations("finished")} />
              </TabsContent>

              <TabsContent value="cancelled" className="mt-0">
                <ReservationsList reservations={filterReservations("cancelled")} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};