import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Car, DollarSign, Calendar, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [reservationCount, setReservationCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const { rate } = useExchangeRate({ provider: 'yadio', code: 'USD' });

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription for pending reservations
    if (user) {
      const channel = supabase
        .channel('owner-pending-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'reservations',
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            fetchPendingCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Fetch KYC status
      const { data: kycData } = await supabase
        .from('kyc_verifications')
        .select('status')
        .eq('user_id', user.id)
        .single();
      
      setKycStatus(kycData?.status || null);

      // Fetch vehicle count
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      setVehicleCount(vehicleCount || 0);

      // Fetch reservation count
      const { count: reservationCount } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);
      
      setReservationCount(reservationCount || 0);

      // Calculate earnings (simplified - sum of paid payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount_total, reservations!inner(owner_id)')
        .eq('reservations.owner_id', user.id)
        .eq('status', 'paid');
      
      const total = payments?.reduce((sum, p) => sum + Number(p.amount_total), 0) || 0;
      setTotalEarnings(total);

      // Fetch pending reservations count
      await fetchPendingCount();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    if (!user) return;
    
    try {
      const { count } = await supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id)
        .eq('status', 'pending' as any);
      
      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  };

  const getKycBadge = () => {
    if (!kycStatus) {
      return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" />Sin iniciar</Badge>;
    }
    switch (kycStatus) {
      case 'verified':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Verificado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><AlertCircle className="h-3 w-3" />Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Rechazado</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const usdEquivalent = rate ? (totalEarnings / rate.value).toFixed(2) : '...';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard de Propietario</h1>
              <p className="text-muted-foreground">Gestiona tus vehículos y ganancias</p>
            </div>
            <Link to="/owner/vehicles/new">
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Publicar mi vehículo
              </Button>
            </Link>
          </div>

          {/* KYC Warning */}
          {kycStatus !== 'verified' && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5" />
                  Verificación KYC requerida
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Debes completar tu verificación KYC para poder publicar vehículos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/kyc">
                  <Button variant="outline" className="border-amber-600 text-amber-800 hover:bg-amber-100">
                    Completar KYC
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Pending Reservations Alert */}
          {pendingCount > 0 && (
            <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-5 w-5" />
                  Reservas por aprobar
                  <Badge variant="default" className="ml-auto bg-amber-600" aria-live="polite">
                    {pendingCount}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300">
                  Tienes {pendingCount} solicitud{pendingCount !== 1 ? 'es' : ''} de reserva pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/owner/reservas-pendientes">
                  <Button variant="outline" className="w-full border-amber-600 text-amber-800 hover:bg-amber-100">
                    Ver solicitudes pendientes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado KYC</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getKycBadge()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Bs {totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">≈ ${usdEquivalent} USD</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Vehículos</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{vehicleCount}</div>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </CardContent>
            </Card>

            <Link to="/owner/reservas-pendientes" className="block">
              <Card className={`transition-colors ${pendingCount > 0 ? 'border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/10' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Por Aprobar</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{pendingCount}</div>
                    {pendingCount > 0 && (
                      <Badge variant="default" className="bg-amber-600">Nuevas</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
              <CardDescription>Gestiona tus vehículos y reservas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Link to="/perfil">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Car className="h-4 w-4" />
                  Ver mis vehículos
                </Button>
              </Link>
              <Link to="/owner/reservas-pendientes">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="h-4 w-4" />
                  Reservas por aprobar
                  {pendingCount > 0 && (
                    <Badge variant="default" className="ml-auto bg-amber-600">{pendingCount}</Badge>
                  )}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
