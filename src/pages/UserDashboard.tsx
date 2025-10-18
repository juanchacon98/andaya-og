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
  Shield
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
  rating_avg: number;
  city: string | null;
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

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

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

      // Fetch upcoming reservations (as renter)
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
        .order('start_date', { ascending: true });

      if (upcomingError) throw upcomingError;
      setUpcomingReservations(upcomingData || []);

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
      setPastReservations(pastData || []);

      // Fetch my vehicles if owner
      if (rolesData?.some((r: UserRole) => r.role === 'owner')) {
        const { data: vehiclesData, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (vehiclesError) throw vehiclesError;
        setMyVehicles(vehiclesData || []);
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Header with user summary */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile?.full_name || 'Usuario'}</h1>
                <p className="text-muted-foreground mb-4">{user?.email}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{activeReservations}</p>
                      <p className="text-xs text-muted-foreground">Reservas activas</p>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Car className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{myVehicles.length}</p>
                        <p className="text-xs text-muted-foreground">Carros publicados</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">4.8</p>
                      <p className="text-xs text-muted-foreground">Como conductor</p>
                    </div>
                  </div>
                  
                  {isOwner && (
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold">4.9</p>
                        <p className="text-xs text-muted-foreground">Como dueño</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate('/perfil')}
                  title="Mensajes"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => navigate('/perfil')}
                  title="Configuración"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto">
            <TabsTrigger value="reservas" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mis reservas
            </TabsTrigger>
            {isOwner && (
              <TabsTrigger value="vehiculos" className="gap-2">
                <Car className="h-4 w-4" />
                Mis vehículos
              </TabsTrigger>
            )}
            <TabsTrigger value="favoritos" className="gap-2">
              <Heart className="h-4 w-4" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger value="perfil" className="gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          {/* Reservations tab */}
          <TabsContent value="reservas" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Reservas próximas</h2>
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
                <div className="grid gap-4">
                  {upcomingReservations.map((reservation) => (
                    <Card key={reservation.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-full md:w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-semibold">{reservation.vehicles.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {reservation.vehicles.brand} {reservation.vehicles.model}
                                </p>
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Desde: {new Date(reservation.start_date).toLocaleDateString('es-VE')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>Hasta: {new Date(reservation.end_date).toLocaleDateString('es-VE')}</span>
                              </div>
                              {reservation.vehicles.city && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span>{reservation.vehicles.city}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">${reservation.total}</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Modificar
                              </Button>
                              <Button variant="outline" size="sm">Ver detalles</Button>
                              {reservation.status === 'pending' && (
                                <Button variant="destructive" size="sm">
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-8" />

            <div>
              <h2 className="text-2xl font-bold mb-4">Historial de viajes</h2>
              {pastReservations.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No tienes viajes anteriores</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pastReservations.map((reservation) => (
                    <Card key={reservation.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-full md:w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                              <Car className="h-8 w-8 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold">{reservation.vehicles.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(reservation.start_date).toLocaleDateString('es-VE')} - {new Date(reservation.end_date).toLocaleDateString('es-VE')}
                                </p>
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                            
                            <div className="flex gap-2 mt-3">
                              <Button variant="outline" size="sm">
                                <Star className="h-4 w-4 mr-2" />
                                Calificar
                              </Button>
                              <Button variant="outline" size="sm">Ver recibo</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Vehicles tab (only for owners) */}
          {isOwner && (
            <TabsContent value="vehiculos" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Mis vehículos</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar nuevo vehículo
                </Button>
              </div>

              {myVehicles.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No tienes vehículos publicados</p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Publicar mi primer vehículo
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myVehicles.map((vehicle) => (
                    <Card key={vehicle.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-full md:w-48 h-32 bg-muted rounded-lg flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-semibold">{vehicle.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {vehicle.brand} {vehicle.model} {vehicle.year}
                                </p>
                              </div>
                              {getVehicleStatusBadge(vehicle.status)}
                            </div>
                            
                            <Separator />
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Precio por día</p>
                                <p className="font-semibold">Bs {vehicle.price_bs}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Calificación</p>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                  <span className="font-semibold">{Number(vehicle.rating_avg).toFixed(1)}</span>
                                </div>
                              </div>
                              {vehicle.city && (
                                <div>
                                  <p className="text-muted-foreground">Ubicación</p>
                                  <p className="font-semibold">{vehicle.city}</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </Button>
                              <Button variant="outline" size="sm">
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                              </Button>
                              <Button variant="outline" size="sm">Ver estadísticas</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Favorites tab */}
          <TabsContent value="favoritos">
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tienes favoritos guardados</p>
                <Button asChild className="mt-4">
                  <Link to="/explorar">Explorar vehículos</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile tab */}
          <TabsContent value="perfil" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información personal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre completo</label>
                  <p className="text-muted-foreground">{profile?.full_name || 'No especificado'}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Correo electrónico</label>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <p className="text-muted-foreground">{profile?.phone || 'No especificado'}</p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium">Roles</label>
                  <div className="flex gap-2 mt-2">
                    {userRoles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role === 'renter' ? 'Arrendatario' : role === 'owner' ? 'Propietario' : role}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button className="mt-4">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar perfil
                </Button>
              </CardContent>
            </Card>

            {/* KYC Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verificación de identidad (KYC)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <div className="mt-2">
                    {!kycStatus && (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Sin iniciar
                      </Badge>
                    )}
                    {kycStatus === 'verified' && (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Verificado
                      </Badge>
                    )}
                    {kycStatus === 'pending' && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pendiente de revisión
                      </Badge>
                    )}
                    {kycStatus === 'rejected' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
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
                      <Button asChild className="gap-2">
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
    </div>
  );
}
