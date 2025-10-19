import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { ReservationDetailsDialog } from '@/components/ReservationDetailsDialog';
import { ModifyReservationDialog } from '@/components/ModifyReservationDialog';
import { VehicleStatsDialog } from '@/components/owner/VehicleStatsDialog';
import { VehicleReservationsDialog } from '@/components/owner/VehicleReservationsDialog';
import { VehicleEditDialog } from '@/components/owner/VehicleEditDialog';
import { VehiclePhotosManager } from '@/components/owner/VehiclePhotosManager';
import { YummyIntegrationBanner } from '@/components/mock/YummyIntegrationBanner';
import { TuGrueroSimulator } from '@/components/mock/TuGrueroSimulator';
import { fetchProfileWithFallback } from '@/lib/profileHelpers';
import { 
  User, 
  Car, 
  Calendar, 
  Star, 
  Bell, 
  CreditCard, 
  MessageSquare,
  Settings,
  Heart,
  Clock,
  MapPin,
  Edit,
  Pause,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Eye,
  Trash2,
  Image
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total: number;
  vehicle_id: string;
  vehicles: {
    id: string;
    title: string;
    brand: string;
    model: string;
    city: string | null;
  };
}

interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price_bs: number;
  status: string;
  type: string;
  rating_avg: number;
  city: string | null;
  reservations_30d?: number;
  revenue_30d?: number;
}

interface UserRole {
  role: string;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);
  const [pastReservations, setPastReservations] = useState<Reservation[]>([]);
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reservas');
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [reservationToCancel, setReservationToCancel] = useState<string | null>(null);
  
  // Vehicle management state
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [photosVehicle, setPhotosVehicle] = useState<Vehicle | null>(null);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [reservationsVehicle, setReservationsVehicle] = useState<Vehicle | null>(null);
  const [reservationsOpen, setReservationsOpen] = useState(false);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch profile (con fallback)
      const profileResult = await fetchProfileWithFallback(user.id);
      if (profileResult.error) throw profileResult.error;
      setProfile(profileResult.data as any);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (rolesError) throw rolesError;
      setUserRoles(rolesData?.map((r: UserRole) => r.role) || []);

      // Fetch KYC status
      const { data: kycData } = await supabase
        .from('kyc_verifications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setKycStatus(kycData?.status || null);

      // Fetch upcoming reservations (as renter) - ordered by most recent first
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total,
          vehicle_id,
          owner_id,
          vehicles (
            id,
            title,
            brand,
            model,
            city
          )
        `)
        .eq('renter_id', user.id)
        .gte('start_date', today)
        .order('start_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (upcomingError) throw upcomingError;
      
      // Fetch owner details for upcoming reservations
      const upcomingWithOwners = await Promise.all(
        (upcomingData || []).map(async (res: any) => {
          const { data: ownerData } = await supabase
            .from('v_profiles_basic' as any)
            .select('id, full_name, phone, kyc_status')
            .eq('id', res.owner_id)
            .maybeSingle();
          
          return {
            ...res,
            owner: ownerData || { 
              id: res.owner_id, 
              full_name: 'Desconocido', 
              phone: '',
              kyc_status: 'unverified' 
            }
          };
        })
      );
      
      setUpcomingReservations(upcomingWithOwners);

      // Fetch past reservations
      const { data: pastData, error: pastError } = await supabase
        .from('reservations')
        .select(`
          id,
          start_date,
          end_date,
          status,
          total,
          vehicle_id,
          owner_id,
          vehicles (
            id,
            title,
            brand,
            model,
            city
          )
        `)
        .eq('renter_id', user.id)
        .lt('end_date', today)
        .order('end_date', { ascending: false })
        .limit(10);

      if (pastError) throw pastError;
      
      // Fetch owner details for past reservations
      const pastWithOwners = await Promise.all(
        (pastData || []).map(async (res: any) => {
          const { data: ownerData } = await supabase
            .from('v_profiles_basic' as any)
            .select('id, full_name, phone, kyc_status')
            .eq('id', res.owner_id)
            .maybeSingle();
          
          return {
            ...res,
            owner: ownerData || { 
              id: res.owner_id, 
              full_name: 'Desconocido', 
              phone: '',
              kyc_status: 'unverified' 
            }
          };
        })
      );
      
      setPastReservations(pastWithOwners);

      // Fetch my vehicles if owner
      if (rolesData?.some((r: UserRole) => r.role === 'owner')) {
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (vehiclesError) throw vehiclesError;

        // Fetch mini-summary for each vehicle (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const vehiclesWithStats = await Promise.all(
          (vehiclesData || []).map(async (vehicle) => {
            const { count } = await supabase
              .from('reservations')
              .select('*', { count: 'exact', head: true })
              .eq('vehicle_id', vehicle.id)
              .gte('created_at', thirtyDaysAgo.toISOString());

            const { data: revenueData } = await supabase
              .from('reservations')
              .select('total')
              .eq('vehicle_id', vehicle.id)
              .gte('created_at', thirtyDaysAgo.toISOString());

            const revenue_30d = revenueData?.reduce((sum, r) => sum + Number(r.total), 0) || 0;

            return {
              ...vehicle,
              reservations_30d: count || 0,
              revenue_30d,
            };
          })
        );

        setMyVehicles(vehiclesWithStats);
      }
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      toast.error('Error al cargar los datos del perfil');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'outline' },
      approved: { label: 'Activa', variant: 'default' },
      finished: { label: 'Finalizada', variant: 'secondary' },
      cancelled: { label: 'Cancelada', variant: 'destructive' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getVehicleStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Activo', variant: 'default' },
      pending_review: { label: 'En revisión', variant: 'outline' },
      inactive: { label: 'Pausado', variant: 'secondary' }
    };
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsDialog(true);
  };

  const handleModify = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowModifyDialog(true);
  };

  const handleCancelClick = (reservationId: string) => {
    setReservationToCancel(reservationId);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!reservationToCancel) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', reservationToCancel);

      if (error) throw error;

      toast.success('Reserva cancelada exitosamente');
      fetchUserData();
    } catch (error: any) {
      console.error('Error canceling reservation:', error);
      toast.error('Error al cancelar la reserva: ' + error.message);
    } finally {
      setShowCancelDialog(false);
      setReservationToCancel(null);
    }
  };

  // Vehicle management handlers
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setEditOpen(true);
  };

  const handleManagePhotos = (vehicle: Vehicle) => {
    setPhotosVehicle(vehicle);
    setPhotosOpen(true);
  };

  const handleViewVehicleReservations = (vehicle: Vehicle) => {
    setReservationsVehicle(vehicle);
    setReservationsOpen(true);
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicle || !user) return;

    try {
      // Check for active or future reservations
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('vehicle_id', deleteVehicle.id)
        .in('status', ['approved', 'pending'])
        .gte('end_at', new Date().toISOString());

      if (count && count > 0) {
        toast.error('No puedes eliminar un vehículo con reservas activas o próximas');
        return;
      }

      // Soft delete
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'paused'
        })
        .eq('id', deleteVehicle.id)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast.success('Vehículo eliminado exitosamente');
      fetchUserData();
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setDeleteVehicle(null);
    }
  };

  const filterVehiclesByStatus = (status: string) => {
    if (status === 'all') return myVehicles;
    return myVehicles.filter(v => v.status === status);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwner = userRoles.includes('owner');
  const activeReservations = upcomingReservations.filter(r => r.status === 'approved').length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Header section with profile summary */}
      <section aria-labelledby="perfil-header" className="bg-background border-b border-border">
        <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-3 sm:pb-4">
          <Card className="rounded-xl shadow-sm overflow-hidden">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 break-words" style={{ fontSize: '1.25rem', lineHeight: '1.75rem', color: 'hsl(var(--foreground))' }}>
                  {profile?.full_name || 'Usuario'}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4 break-all">{user?.email}</p>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold">{activeReservations}</p>
                      <p className="text-xs text-muted-foreground">Reservas activas</p>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-bold">{myVehicles.length}</p>
                        <p className="text-xs text-muted-foreground">Carros publicados</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3 self-start sm:self-center">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10 sm:h-11 sm:w-11"
                  onClick={() => toast.info("Funcionalidad de mensajes próximamente")}
                  title="Mensajes"
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-10 w-10 sm:h-11 sm:w-11"
                  onClick={() => setActiveTab('perfil')}
                  title="Configuración"
                >
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* KYC Alert for Owners without verification */}
          {isOwner && (!kycStatus || kycStatus !== 'verified') && (
          <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-xl shadow-sm overflow-hidden mb-4 sm:mb-6">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="p-2 rounded-lg bg-amber-500 text-white flex-shrink-0">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1 text-sm sm:text-base break-words">
                    {!kycStatus ? 'Verificación KYC requerida' : 
                     kycStatus === 'pending' ? 'KYC en revisión' :
                     'KYC rechazado - Acción requerida'}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mb-3">
                    {!kycStatus ? 
                      'Para publicar vehículos en la plataforma, necesitas completar tu verificación de identidad.' :
                     kycStatus === 'pending' ?
                      'Tu verificación está siendo revisada. Te notificaremos cuando esté lista.' :
                      'Tu verificación fue rechazada. Por favor, revisa los comentarios y vuelve a intentar.'}
                  </p>
                  {(!kycStatus || kycStatus === 'rejected') && (
                    <Button asChild size="sm" variant="default" className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto min-h-[44px]">
                      <Link to="/kyc">
                        <Shield className="h-4 w-4 mr-2" />
                        {!kycStatus ? 'Completar verificación ahora' : 'Reintentar verificación'}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          )}
        </div>
      </section>

      {/* Sticky tabs navigation */}
      <nav
        aria-label="Secciones del perfil"
        className="sticky top-[56px] z-30 bg-white/90 dark:bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-background/70 border-b border-slate-200 dark:border-border shadow-sm"
      >
        <div className="container mx-auto px-2 sm:px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-1.5 bg-transparent h-12 rounded-none border-none"
            >
              <TabsTrigger 
                value="reservas" 
                className="gap-2 py-2 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-white rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
              >
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Mis reservas</span>
                <span className="sm:hidden">Reservas</span>
              </TabsTrigger>
              {isOwner && (
                <TabsTrigger 
                  value="vehiculos" 
                  className="gap-2 py-2 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-white rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
                >
                  <Car className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Mis vehículos</span>
                  <span className="sm:hidden">Vehículos</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="favoritos" 
                className="gap-2 py-2 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-white rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
              >
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Favoritos</span>
                <span className="sm:hidden">Favs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="perfil" 
                className="gap-2 py-2 text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-white rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
              >
                <User className="h-4 w-4 flex-shrink-0" />
                Perfil
              </TabsTrigger>
            </TabsList>

          </Tabs>
        </div>
      </nav>

      {/* Main content section */}
      <main className="flex-1 container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
          {/* Reservations tab */}
          <TabsContent value="reservas" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
            <div>
              <h1 
                id="perfil-reservas-heading" 
                className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground scroll-mt-navbar-tabs mb-3"
              >
                Reservas próximas
              </h1>
              {upcomingReservations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes reservas próximas</p>
                    <Button asChild className="mt-4">
                      <Link to="/explorar">Explorar vehículos</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {upcomingReservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                          {/* Media */}
                          <div className="aspect-[16/9] sm:aspect-auto sm:h-[100px] rounded-xl bg-slate-100 dark:bg-muted overflow-hidden flex items-center justify-center">
                            <Car className="h-10 w-10 text-slate-400 dark:text-muted-foreground" aria-hidden="true" />
                          </div>
                          
                          {/* Details */}
                          <div className="px-0 sm:px-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <h3 className="text-[clamp(0.95rem,2.5vw,1.05rem)] font-medium leading-tight line-clamp-1 flex-1">
                                {reservation.vehicles.title}
                              </h3>
                              <span className={`ml-auto shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                reservation.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800' :
                                reservation.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800' :
                                'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
                              }`}>
                                {reservation.status === 'approved' ? 'Activa' : 
                                 reservation.status === 'pending' ? 'Pendiente' : 
                                 reservation.status === 'cancelled' ? 'Cancelada' : 'Finalizada'}
                              </span>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-0.5 line-clamp-1">
                              {reservation.vehicles.brand} {reservation.vehicles.model}
                            </p>
                            
                            <ul className="mt-2 space-y-1.5">
                              <li className="flex items-center gap-2 text-[13px] sm:text-sm text-slate-700 dark:text-foreground">
                                <Clock className="h-4 w-4 text-slate-500 dark:text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                <span>Desde: {new Date(reservation.start_date).toLocaleDateString('es-VE')}</span>
                              </li>
                              <li className="flex items-center gap-2 text-[13px] sm:text-sm text-slate-700 dark:text-foreground">
                                <Clock className="h-4 w-4 text-slate-500 dark:text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                <span>Hasta: {new Date(reservation.end_date).toLocaleDateString('es-VE')}</span>
                              </li>
                              {reservation.vehicles.city && (
                                <li className="flex items-center gap-2 text-[13px] sm:text-sm text-slate-700 dark:text-foreground">
                                  <MapPin className="h-4 w-4 text-slate-500 dark:text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                  <span className="line-clamp-1">{reservation.vehicles.city}</span>
                                </li>
                              )}
                              <li className="flex items-center gap-2 text-[13px] sm:text-sm">
                                <CreditCard className="h-4 w-4 text-slate-500 dark:text-muted-foreground flex-shrink-0" aria-hidden="true" />
                                <span className="font-semibold text-slate-900 dark:text-foreground">
                                  Bs {new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(reservation.total)}
                                </span>
                              </li>
                            </ul>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              {reservation.status === 'pending' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-9 px-3 text-sm rounded-lg"
                                  onClick={() => handleModify(reservation)}
                                  aria-label="Modificar reserva"
                                >
                                  <Edit className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  Modificar
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="h-9 px-3 text-sm rounded-lg"
                                onClick={() => handleViewDetails(reservation)}
                                aria-label="Ver detalles de la reserva"
                              >
                                <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                Ver detalles
                              </Button>
                              {reservation.status === 'pending' && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="h-9 px-3 text-sm rounded-lg"
                                  onClick={() => handleCancelClick(reservation.id)}
                                  aria-label="Cancelar reserva"
                                >
                                  <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-6 sm:my-8" />

            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground scroll-mt-navbar-tabs mb-3">Historial de viajes</h2>
              {pastReservations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes viajes anteriores</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {pastReservations.map((reservation) => (
                    <div key={reservation.id} className="rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm overflow-hidden">
                      <div className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[120px_1fr]">
                          {/* Media */}
                          <div className="aspect-[16/9] sm:aspect-auto sm:h-[80px] rounded-xl bg-slate-100 dark:bg-muted overflow-hidden flex items-center justify-center">
                            <Car className="h-8 w-8 text-slate-400 dark:text-muted-foreground" aria-hidden="true" />
                          </div>
                          
                          {/* Details */}
                          <div className="px-0 sm:px-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[clamp(0.9rem,2.5vw,1rem)] font-medium leading-tight line-clamp-1">
                                  {reservation.vehicles.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-0.5">
                                  {new Date(reservation.start_date).toLocaleDateString('es-VE')} - {new Date(reservation.end_date).toLocaleDateString('es-VE')}
                                </p>
                              </div>
                              <span className={`ml-auto shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                reservation.status === 'finished' ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700' :
                                'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800'
                              }`}>
                                {reservation.status === 'finished' ? 'Finalizada' : 'Cancelada'}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-3 text-sm rounded-lg"
                                aria-label="Calificar reserva"
                              >
                                <Star className="h-4 w-4 mr-1.5" aria-hidden="true" />
                                Calificar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-9 px-3 text-sm rounded-lg"
                                aria-label="Ver recibo"
                              >
                                Ver recibo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Vehicles tab (only for owners) */}
          {isOwner && (
            <TabsContent value="vehiculos" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground scroll-mt-navbar-tabs">Mis vehículos</h1>
                <Button 
                  className="min-h-[44px] text-xs sm:text-sm relative z-10"
                  onClick={() => navigate('/owner/vehicles/new')}
                  data-umami-event="owner_add_vehicle_click"
                  aria-label="Agregar nuevo vehículo"
                  disabled={kycStatus !== 'verified'}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Agregar nuevo</span>
                  <span className="sm:hidden">Nuevo</span>
                </Button>
              </div>

              {myVehicles.length === 0 ? (
                <Card className="rounded-xl shadow-sm overflow-hidden">
                  <CardContent className="pt-6 text-center py-12">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No tienes vehículos publicados</p>
                    {kycStatus === 'verified' ? (
                      <Button onClick={() => navigate('/owner/vehicles/new')} className="min-h-[44px]">
                        <Plus className="h-4 w-4 mr-2" />
                        Publicar mi primer vehículo
                      </Button>
                    ) : (
                      <Button asChild className="min-h-[44px]">
                        <Link to="/kyc">
                          <Shield className="h-4 w-4 mr-2" />
                          Completar verificación KYC
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Status filter tabs */}
                  <Tabs value={vehicleStatusFilter} onValueChange={setVehicleStatusFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4">
                      <TabsTrigger value="all">
                        Todos ({myVehicles.length})
                      </TabsTrigger>
                      <TabsTrigger value="active">
                        Activos ({filterVehiclesByStatus('active').length})
                      </TabsTrigger>
                      <TabsTrigger value="pending_review">
                        Pendientes ({filterVehiclesByStatus('pending_review').length})
                      </TabsTrigger>
                      <TabsTrigger value="paused">
                        Pausados ({filterVehiclesByStatus('paused').length})
                      </TabsTrigger>
                      <TabsTrigger value="rejected">
                        Rechazados ({filterVehiclesByStatus('rejected').length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value={vehicleStatusFilter} className="mt-0">
                      <div className="grid gap-3 sm:gap-4">
                        {filterVehiclesByStatus(vehicleStatusFilter).map((vehicle) => (
                          <Card key={vehicle.id} className="rounded-xl shadow-sm overflow-hidden">
                            <CardContent className="pt-4 sm:pt-6 max-w-full">
                              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-full sm:w-40 md:w-48 h-28 sm:h-32 bg-muted rounded-lg flex items-center justify-center">
                                    <Car className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                                  </div>
                                </div>
                                
                                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <h3 className="text-base sm:text-lg md:text-xl font-semibold break-words">{vehicle.title}</h3>
                                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                                        {vehicle.brand} {vehicle.model} {vehicle.year}
                                      </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                      {getVehicleStatusBadge(vehicle.status)}
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                                    <div className="min-w-0">
                                      <p className="text-muted-foreground">Ubicación</p>
                                      <p className="font-semibold break-words">{vehicle.city || 'No especificada'}</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-muted-foreground">Precio/día</p>
                                      <p className="font-semibold">Bs {vehicle.price_bs}</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-muted-foreground">Reservas (30d)</p>
                                      <p className="font-semibold">{vehicle.reservations_30d || 0}</p>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-muted-foreground">Ingresos (30d)</p>
                                      <p className="font-semibold">Bs {(vehicle.revenue_30d || 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="min-h-[44px] text-xs sm:text-sm"
                                      onClick={() => handleViewVehicleReservations(vehicle)}
                                      title="Ver reservas"
                                    >
                                      <Calendar className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Reservas</span>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="min-h-[44px] text-xs sm:text-sm"
                                      onClick={() => handleManagePhotos(vehicle)}
                                      title="Gestionar fotos"
                                    >
                                      <Image className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Fotos</span>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="min-h-[44px] text-xs sm:text-sm"
                                      onClick={() => handleEditVehicle(vehicle)}
                                      title="Editar detalles"
                                    >
                                      <Edit className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Editar</span>
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="min-h-[44px] text-xs sm:text-sm"
                                      onClick={() => {
                                        setSelectedVehicle(vehicle);
                                        setShowStatsDialog(true);
                                      }}
                                      title="Ver estadísticas"
                                    >
                                      <Eye className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Estadísticas</span>
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      className="min-h-[44px] text-xs sm:text-sm"
                                      onClick={() => setDeleteVehicle(vehicle)}
                                      title="Eliminar vehículo"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1.5" />
                                      <span className="hidden sm:inline">Eliminar</span>
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </TabsContent>
          )}

          {/* Favorites tab */}
          <TabsContent value="favoritos" className="pt-3 sm:pt-4">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground scroll-mt-navbar-tabs mb-3">Favoritos</h1>
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardContent className="pt-6 text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tienes favoritos guardados</p>
                <Button asChild className="min-h-[44px]">
                  <Link to="/explorar">Explorar vehículos</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile tab */}
          <TabsContent value="perfil" className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-foreground scroll-mt-navbar-tabs mb-3">Mi perfil</h1>
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Información personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre completo</label>
                  <p className="text-sm sm:text-base text-muted-foreground break-words">{profile?.full_name || 'No especificado'}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Correo electrónico</label>
                  <p className="text-sm sm:text-base text-muted-foreground break-all">{user?.email}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <p className="text-sm sm:text-base text-muted-foreground break-words">{profile?.phone || 'No especificado'}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Roles</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {userRoles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role === 'renter' ? 'Arrendatario' : role === 'owner' ? 'Propietario' : role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button className="mt-4 w-full sm:w-auto min-h-[44px]">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar perfil
                </Button>
              </CardContent>
            </Card>

            {/* KYC Status Card */}
            <Card className="rounded-xl shadow-sm overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5 flex-shrink-0" />
                  <span className="break-words">Verificación de identidad (KYC)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <div className="mt-2">
                    {!kycStatus && (
                      <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Sin iniciar
                      </Badge>
                    )}
                    {kycStatus === 'verified' && (
                      <Badge variant="default" className="gap-1 bg-green-600 text-xs sm:text-sm">
                        <CheckCircle className="h-3 w-3 flex-shrink-0" />
                        Verificado
                      </Badge>
                    )}
                    {kycStatus === 'pending' && (
                      <Badge variant="secondary" className="gap-1 text-xs sm:text-sm">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        Pendiente de revisión
                      </Badge>
                    )}
                    {kycStatus === 'rejected' && (
                      <Badge variant="destructive" className="gap-1 text-xs sm:text-sm">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Rechazado
                      </Badge>
                    )}
                  </div>
                </div>
                
                {(!kycStatus || kycStatus === 'rejected') && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {!kycStatus 
                          ? 'Completa tu verificación de identidad para publicar vehículos y acceder a todas las funcionalidades.'
                          : 'Tu verificación fue rechazada. Por favor, intenta nuevamente con documentos válidos.'
                        }
                      </p>
                      <Button asChild className="gap-2 w-full sm:w-auto min-h-[44px]">
                        <Link to="/kyc">
                          <Shield className="h-4 w-4" />
                          {!kycStatus ? 'Completar verificación KYC' : 'Reintentar verificación'}
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
                
                {kycStatus === 'pending' && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Tu verificación está siendo revisada por nuestro equipo. Te notificaremos cuando esté completa.
                    </p>
                  </>
                )}
                
                {kycStatus === 'verified' && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Tu identidad ha sido verificada correctamente. Ahora puedes publicar vehículos y acceder a todas las funcionalidades.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />

      {/* Dialogs */}
      <ReservationDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        reservation={selectedReservation}
        isOwner={false}
      />

      <ModifyReservationDialog
        open={showModifyDialog}
        onOpenChange={setShowModifyDialog}
        reservation={selectedReservation}
        onSuccess={fetchUserData}
      />

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará tu reserva. Dependiendo de la política de cancelación del vehículo, 
              podrías estar sujeto a cargos por cancelación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive hover:bg-destructive/90">
              Sí, cancelar reserva
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedVehicle && (
        <VehicleStatsDialog
          open={showStatsDialog}
          onOpenChange={setShowStatsDialog}
          vehicleId={selectedVehicle.id}
          vehicleTitle={`${selectedVehicle.brand} ${selectedVehicle.model} ${selectedVehicle.year}`}
          pricePerDay={selectedVehicle.price_bs}
        />
      )}

      {/* Vehicle Management Dialogs */}
      {editVehicle && (
        <VehicleEditDialog
          vehicle={editVehicle}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={fetchUserData}
        />
      )}

      {photosVehicle && (
        <VehiclePhotosManager
          vehicleId={photosVehicle.id}
          vehicleTitle={`${photosVehicle.brand} ${photosVehicle.model} ${photosVehicle.year}`}
          open={photosOpen}
          onOpenChange={setPhotosOpen}
          onSuccess={fetchUserData}
        />
      )}

      {reservationsVehicle && (
        <VehicleReservationsDialog
          open={reservationsOpen}
          onOpenChange={setReservationsOpen}
          vehicleId={reservationsVehicle.id}
          vehicleTitle={`${reservationsVehicle.brand} ${reservationsVehicle.model} ${reservationsVehicle.year}`}
        />
      )}

      {/* Delete Vehicle Confirmation Dialog */}
      <AlertDialog open={!!deleteVehicle} onOpenChange={() => setDeleteVehicle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              El vehículo será archivado y dejará de aparecer en búsquedas. No podrás eliminarlo si tiene reservas activas o próximas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
