import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Car, Calendar, DollarSign, TrendingUp, User, MessageCircle, Eye, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatBs } from "@/lib/currency";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { createWhatsAppLink } from "@/lib/phone";
import { ReservationDetailsDialog } from "@/components/ReservationDetailsDialog";

interface VehicleReservation {
  id: string;
  start_date: string;
  end_date: string;
  start_at: string | null;
  end_at: string | null;
  total: number;
  final_total_bs: number | null;
  total_price_bs: number | null;
  status: string;
  payment_status: string | null;
  created_at: string;
  renter_id: string;
  vehicle_id: string;
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

interface ReservationStats {
  active: number;
  completed: number;
  totalRevenue: number;
}

export default function MisReservasAutos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<VehicleReservation[]>([]);
  const [stats, setStats] = useState<ReservationStats>({ active: 0, completed: 0, totalRevenue: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<VehicleReservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchReservations();

    // Realtime subscription
    const channel = supabase
      .channel('owner-all-reservations')
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
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchReservations = async () => {
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
          payment_status,
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch renter details
      const reservationsWithRenter = await Promise.all(
        (data || []).map(async (res: any) => {
          const { data: renterData } = await supabase
            .from('v_profiles_basic' as any)
            .select('id, full_name, phone, kyc_status')
            .eq('id', res.renter_id)
            .maybeSingle();

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

      setReservations(reservationsWithRenter);

      // Calculate stats
      const activeCount = reservationsWithRenter.filter(r => 
        r.status === 'active' || r.status === 'approved'
      ).length;
      
      const completedCount = reservationsWithRenter.filter(r => 
        r.status === 'completed'
      ).length;
      
      const totalRevenue = reservationsWithRenter
        .filter(r => r.payment_status === 'paid' || r.payment_status === 'simulated')
        .reduce((sum, r) => sum + (r.final_total_bs || r.total_price_bs || r.total || 0), 0);

      setStats({
        active: activeCount,
        completed: completedCount,
        totalRevenue,
      });
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      requested: { label: 'Solicitada', variant: 'outline' },
      pending: { label: 'Solicitada', variant: 'outline' },
      approved: { label: 'Aprobada', variant: 'default' },
      active: { label: 'Activa', variant: 'default' },
      completed: { label: 'Completada', variant: 'secondary' },
      rejected: { label: 'Rechazada', variant: 'destructive' },
      cancelled: { label: 'Cancelada', variant: 'secondary' },
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentBadge = (paymentStatus: string | null) => {
    if (paymentStatus === 'paid' || paymentStatus === 'simulated') {
      return <Badge className="bg-green-600 text-white">Pagado</Badge>;
    }
    return <Badge variant="outline">Pendiente</Badge>;
  };

  const handleContactRenter = (reservation: VehicleReservation) => {
    const whatsappLink = createWhatsAppLink(
      reservation.renter.phone,
      `Hola ${reservation.renter.full_name}, te contacto sobre tu reserva del ${reservation.vehicles.brand} ${reservation.vehicles.model}.`
    );

    if (!whatsappLink) {
      toast.error('El arrendatario no tiene un número de WhatsApp válido');
      return;
    }

    window.open(whatsappLink, '_blank');
  };

  const handleViewDetails = (reservation: VehicleReservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
  };

  const filterReservations = (filter: string) => {
    if (filter === 'all') return reservations;
    return reservations.filter(r => r.status === filter);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/owner/vehicles')} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </Button>
              </div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🚗 Reservas de mis Autos
              </h1>
              <p className="text-muted-foreground">Gestiona todas las reservas de tus vehículos</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  En curso o aprobadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reservas Completadas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Total finalizadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBs(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  Acumulados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Todas las Reservas</CardTitle>
              <CardDescription>
                Historial completo de reservas de tus vehículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full" onValueChange={setStatusFilter}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">
                    Todas ({reservations.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Aprobadas ({filterReservations('approved').length})
                  </TabsTrigger>
                  <TabsTrigger value="active">
                    Activas ({filterReservations('active').length})
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completadas ({filterReservations('completed').length})
                  </TabsTrigger>
                  <TabsTrigger value="requested">
                    Solicitadas ({filterReservations('requested').length + filterReservations('pending').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={statusFilter} className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Fechas</TableHead>
                        <TableHead>Arrendatario</TableHead>
                        <TableHead>Estado Pago</TableHead>
                        <TableHead>Monto Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterReservations(statusFilter).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No hay reservas en esta categoría
                          </TableCell>
                        </TableRow>
                      ) : (
                        filterReservations(statusFilter).map((reservation) => (
                          <TableRow key={reservation.id}>
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
                              <div className="text-sm">
                                <div>{format(new Date(reservation.start_date), "dd MMM", { locale: es })}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(reservation.end_date), "dd MMM yyyy", { locale: es })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="font-medium">{reservation.renter.full_name}</div>
                                  {reservation.renter.phone && (
                                    <button
                                      onClick={() => handleContactRenter(reservation)}
                                      className="text-xs text-primary hover:underline"
                                    >
                                      Contactar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getPaymentBadge(reservation.payment_status)}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold">
                                {formatBs(reservation.final_total_bs || reservation.total_price_bs || reservation.total)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(reservation.status)}
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
                                {reservation.renter.phone && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleContactRenter(reservation)}
                                    className="bg-green-600 hover:bg-green-700"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

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
