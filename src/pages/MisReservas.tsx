import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Car, MapPin, Clock, MessageCircle, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createWhatsAppLink } from '@/lib/phone';
import { ReservationDetailsDialog } from '@/components/ReservationDetailsDialog';

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total: number;
  daily_price: number;
  subtotal: number;
  service_fee: number;
  rejected_reason?: string;
  created_at: string;
  vehicles: {
    id: string;
    brand: string;
    model: string;
    year: number;
    city: string | null;
    vehicle_photos: Array<{ url: string; sort_order: number }>;
  };
  profiles: {
    id: string;
    full_name: string;
    phone: string;
  };
}

export default function MisReservas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReservations();
    subscribeToRealtimeUpdates();
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [reservations, statusFilter]);

  const fetchReservations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          vehicles!reservations_vehicle_id_fkey (
            id,
            brand,
            model,
            year,
            city,
            vehicle_photos (url, sort_order)
          )
        `)
        .eq('renter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch owner details for each reservation
      const reservationsWithOwners = await Promise.all(
        (data || []).map(async (res: any) => {
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('id', res.owner_id)
            .single();
          
          return {
            ...res,
            profiles: ownerData || { id: res.owner_id, full_name: 'Desconocido', phone: '' }
          };
        })
      );

      setReservations(reservationsWithOwners);
    } catch (error: any) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtimeUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel('my-reservations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `renter_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Reservation realtime update:', payload);
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const applyFilters = () => {
    let filtered = [...reservations];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReservations(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Solicitada', variant: 'outline' },
      approved: { label: 'Aprobada', variant: 'default' },
      rejected: { label: 'Rechazada', variant: 'destructive' },
      cancelled: { label: 'Cancelada', variant: 'secondary' },
      completed: { label: 'Finalizada', variant: 'secondary' },
      finished: { label: 'Finalizada', variant: 'secondary' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleContactOwner = (reservation: Reservation) => {
    const whatsappLink = createWhatsAppLink(
      reservation.profiles.phone,
      `Hola ${reservation.profiles.full_name}, te contacto sobre la reserva de tu ${reservation.vehicles.brand} ${reservation.vehicles.model} del ${format(new Date(reservation.start_date), 'dd/MM/yyyy', { locale: es })}.`
    );

    if (!whatsappLink) {
      toast.error('El dueño no tiene un número de WhatsApp válido');
      return;
    }

    window.open(whatsappLink, '_blank');
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
      toast.success('Reserva cancelada exitosamente');
      fetchReservations();
    } catch (error: any) {
      console.error('Error canceling reservation:', error);
      toast.error('Error al cancelar la reserva: ' + error.message);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
  };

  const canContactOwner = (status: string) => {
    return ['approved', 'completed', 'finished'].includes(status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando reservas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Mis Reservas</h1>
          <p className="text-muted-foreground">Gestiona tus solicitudes y reservas de vehículos</p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex gap-4 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Solicitadas</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
              <SelectItem value="completed">Finalizadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {filteredReservations.length} reserva{filteredReservations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista de reservas */}
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                {statusFilter === 'all' 
                  ? 'Aún no tienes reservas' 
                  : 'No hay reservas con este estado'}
              </p>
              <Button asChild className="mt-4">
                <Link to="/explorar">Explorar vehículos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredReservations.map((reservation) => {
              const mainPhoto = reservation.vehicles.vehicle_photos
                ?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url;

              return (
                <Card key={reservation.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Imagen del vehículo */}
                      <div className="flex-shrink-0">
                        <div className="w-full md:w-48 h-32 bg-muted rounded-lg overflow-hidden">
                          {mainPhoto ? (
                            <img 
                              src={mainPhoto} 
                              alt={`${reservation.vehicles.brand} ${reservation.vehicles.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info de la reserva */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {reservation.vehicles.brand} {reservation.vehicles.model} {reservation.vehicles.year}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{reservation.vehicles.city || 'Venezuela'}</span>
                            </div>
                          </div>
                          {getStatusBadge(reservation.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(reservation.start_date), 'dd MMM', { locale: es })} - {format(new Date(reservation.end_date), 'dd MMM yyyy', { locale: es })}
                            </span>
                          </div>
                          <div className="text-sm">
                            <span className="font-semibold">Total: Bs {reservation.total.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Mensaje de estado */}
                        {reservation.status === 'pending' && (
                          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded text-sm text-amber-800 dark:text-amber-200">
                            Esperando aprobación del dueño...
                          </div>
                        )}
                        {reservation.status === 'rejected' && reservation.rejected_reason && (
                          <div className="mb-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
                            <strong>Motivo del rechazo:</strong> {reservation.rejected_reason}
                          </div>
                        )}

                        {/* Acciones */}
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewDetails(reservation)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalles
                          </Button>

                          {canContactOwner(reservation.status) && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleContactOwner(reservation)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Contactar al dueño
                            </Button>
                          )}

                          {reservation.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleCancelReservation(reservation.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancelar solicitud
                            </Button>
                          )}

                          {reservation.status === 'approved' && (
                            <Button size="sm" variant="default" asChild>
                              <Link to={`/pago/${reservation.id}`}>
                                Proceder al pago
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      {/* Dialog de detalles */}
      <ReservationDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        reservation={selectedReservation}
        isOwner={false}
      />
    </div>
  );
}