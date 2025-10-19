import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, User, Car, Calendar, CheckCircle, XCircle, Eye, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatBs } from "@/lib/currency";
import { format, isToday, isWithinInterval, addDays } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ReservationDetailsDialog } from "@/components/ReservationDetailsDialog";

interface PendingReservation {
  id: string;
  start_date: string;
  end_date: string;
  start_at: string | null;
  end_at: string | null;
  total: number;
  final_total_bs: number | null;
  total_price_bs: number | null;
  created_at: string;
  renter_id: string;
  vehicle_id: string;
  status: string;
  vehicles: {
    id: string;
    brand: string;
    model: string;
    year: number;
    title: string;
  };
  renter: {
    id: string;
    full_name: string;
    phone: string | null;
    kyc_status: string;
  };
}

export default function ReservasPendientes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingReservations, setPendingReservations] = useState<PendingReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<PendingReservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [reservationToReject, setReservationToReject] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchPendingReservations();

    // Realtime subscription
    const channel = supabase
      .channel('owner-pending-reservations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `owner_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Reservation change:', payload);
          fetchPendingReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchPendingReservations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          start_at,
          end_at,
          total,
          final_total_bs,
          total_price_bs,
          status,
          created_at,
          renter_id,
          vehicle_id,
          vehicles!reservations_vehicle_id_fkey (
            id,
            brand,
            model,
            year,
            title
          )
        `)
        .eq('owner_id', user.id)
        .eq('status', 'pending' as any)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch renter details
      const reservationsWithRenter = await Promise.all(
        (data || []).map(async (res: any) => {
          const { data: renterData } = await supabase
            .from('profiles')
            .select('id, full_name, phone, kyc_status')
            .eq('id', res.renter_id)
            .single();

          return {
            ...res,
            renter: renterData || { 
              id: res.renter_id, 
              full_name: 'Desconocido', 
              phone: null,
              kyc_status: 'unverified' 
            },
          };
        })
      );

      setPendingReservations(reservationsWithRenter);
    } catch (error) {
      console.error('Error fetching pending reservations:', error);
      toast.error('Error al cargar reservas pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId: string) => {
    setProcessingAction(true);
    try {
      const { error } = await supabase.functions.invoke('reservation-approve', {
        body: { reservation_id: reservationId },
      });

      if (error) throw error;

      toast.success('Reserva aprobada exitosamente');
      fetchPendingReservations();
    } catch (error: any) {
      console.error('Error approving reservation:', error);
      toast.error('Error al aprobar reserva: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectClick = (reservationId: string) => {
    setReservationToReject(reservationId);
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!reservationToReject) return;

    setProcessingAction(true);
    try {
      const { error } = await supabase.functions.invoke('reservation-reject', {
        body: { 
          reservation_id: reservationToReject,
          reason: rejectionReason || 'Sin motivo especificado',
        },
      });

      if (error) throw error;

      toast.success('Reserva rechazada');
      setShowRejectDialog(false);
      setRejectionReason("");
      setReservationToReject(null);
      fetchPendingReservations();
    } catch (error: any) {
      console.error('Error rejecting reservation:', error);
      toast.error('Error al rechazar reserva: ' + error.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleViewDetails = (reservation: PendingReservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
  };

  const filterReservations = (filter: 'all' | 'today' | 'week') => {
    if (filter === 'all') return pendingReservations;
    
    const now = new Date();
    return pendingReservations.filter(res => {
      const startDate = new Date(res.start_date);
      
      if (filter === 'today') {
        return isToday(startDate);
      }
      
      if (filter === 'week') {
        return isWithinInterval(startDate, {
          start: now,
          end: addDays(now, 7),
        });
      }
      
      return true;
    });
  };

  const ReservationsTable = ({ reservations }: { reservations: PendingReservation[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Arrendatario</TableHead>
          <TableHead>Vehículo</TableHead>
          <TableHead>Fechas</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Solicitada</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No hay reservas pendientes en esta categoría
            </TableCell>
          </TableRow>
        ) : (
          reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{reservation.renter.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {reservation.renter.kyc_status === 'verified' ? (
                        <Badge variant="default" className="bg-green-600 text-xs">Verificado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Sin verificar</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{reservation.vehicles.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {reservation.vehicles.brand} {reservation.vehicles.model}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <div>{format(new Date(reservation.start_date), "dd MMM", { locale: es })}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(reservation.end_date), "dd MMM", { locale: es })}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">
                  {formatBs(reservation.final_total_bs || reservation.total_price_bs || reservation.total)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(reservation.created_at), "dd MMM HH:mm", { locale: es })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(reservation)}
                    title="Ver detalles"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(reservation.id)}
                    disabled={processingAction}
                    className="bg-green-600 hover:bg-green-700"
                    title="Aprobar"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRejectClick(reservation.id)}
                    disabled={processingAction}
                    title="Rechazar"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  const todayCount = filterReservations('today').length;
  const weekCount = filterReservations('week').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                Reservas por Aprobar
                {pendingReservations.length > 0 && (
                  <Badge 
                    variant="default" 
                    className="text-lg px-3 py-1"
                    aria-live="polite"
                  >
                    {pendingReservations.length}
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">Gestiona las solicitudes de reserva</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/owner')}>
              Volver al Dashboard
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReservations.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inicio Hoy</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Próximos 7 días</CardTitle>
                <Filter className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weekCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Pendientes</CardTitle>
              <CardDescription>
                Revisa y gestiona las solicitudes de reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    Todas ({pendingReservations.length})
                  </TabsTrigger>
                  <TabsTrigger value="today">
                    Hoy ({todayCount})
                  </TabsTrigger>
                  <TabsTrigger value="week">
                    Próx. 7 días ({weekCount})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <ReservationsTable reservations={filterReservations('all')} />
                </TabsContent>

                <TabsContent value="today" className="mt-4">
                  <ReservationsTable reservations={filterReservations('today')} />
                </TabsContent>

                <TabsContent value="week" className="mt-4">
                  <ReservationsTable reservations={filterReservations('week')} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de rechazar esta solicitud? El arrendatario será notificado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Motivo del rechazo (opcional)
            </label>
            <Textarea
              placeholder="Ej: El vehículo no está disponible en esas fechas"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectConfirm}
              disabled={processingAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Rechazar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      {selectedReservation && (
        <ReservationDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          reservation={selectedReservation}
          isOwner={true}
        />
      )}

      <Footer />
    </div>
  );
}
