import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Car, Calendar, TrendingUp, DollarSign, AlertCircle, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ExchangeRateDisplay } from "@/components/admin/ExchangeRateDisplay";
import { formatBs } from "@/lib/currency";
import { toast } from "sonner";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    vehicles: 0,
    activeReservations: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    incidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    fetchStats();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => 
      r.role === "admin_primary" || r.role === "admin_security"
    );

    if (!hasAdminRole) {
      navigate("/");
    }
  };

  const fetchStats = async () => {
    const wasRefreshing = isRefreshing;
    try {
      setIsRefreshing(true);
      
      // Call the centralized RPC function
      const { data, error } = await supabase.rpc('admin_get_metrics');
      
      if (error) {
        console.error("Error fetching metrics:", error);
        toast.error("Error al cargar las estadísticas del dashboard");
        return;
      }

      if (!data || data.length === 0) {
        toast.error("No se pudieron obtener las métricas");
        return;
      }

      const metrics = data[0];
      
      setStats({
        users: Number(metrics.total_users) || 0,
        vehicles: Number(metrics.total_vehicles) || 0,
        activeReservations: Number(metrics.active_reservations) || 0,
        totalRevenue: Number(metrics.revenue_month_bs) || 0,
        pendingVerifications: Number(metrics.pending_kyc) || 0,
        incidents: Number(metrics.open_incidents) || 0
      });
      
      if (wasRefreshing) {
        toast.success("Dashboard actualizado");
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const statCards = [
    {
      title: "Usuarios Registrados",
      value: stats.users,
      icon: Users,
      color: "text-blue-600 bg-blue-50",
      link: "/admin/usuarios",
      description: "Total en auth.users"
    },
    {
      title: "Vehículos Totales",
      value: stats.vehicles,
      icon: Car,
      color: "text-green-600 bg-green-50",
      link: "/admin/vehiculos",
      description: "Todos los estados"
    },
    {
      title: "Reservas en Curso",
      value: stats.activeReservations,
      icon: Calendar,
      color: "text-purple-600 bg-purple-50",
      link: "/admin/reservas",
      description: "Pendientes y aprobadas"
    },
    {
      title: "Ingresos del Mes (Bs)",
      value: formatBs(stats.totalRevenue),
      icon: DollarSign,
      color: "text-yellow-600 bg-yellow-50",
      link: "/admin/pagos",
      description: "Mes actual"
    }
  ];

  const alertCards = [
    {
      title: "Verificaciones KYC",
      value: stats.pendingVerifications,
      description: "Pendientes de revisión",
      icon: TrendingUp,
      link: "/admin/usuarios"
    },
    {
      title: "Incidentes Activos",
      value: stats.incidents,
      description: "Requieren atención",
      icon: AlertCircle,
      link: "/admin/reportes"
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Vista general de la plataforma AndaYa
            </p>
          </div>
          <Button 
            onClick={fetchStats} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border"
              onClick={() => navigate(stat.link)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  {stat.description && (
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  )}
                  {stat.title.includes("Ingresos") && stats.totalRevenue > 0 && (
                    <ExchangeRateDisplay amountBs={stats.totalRevenue} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alertCards.map((alert, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-md transition-all border-border"
              onClick={() => navigate(alert.link)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <alert.icon className="h-5 w-5 text-primary" />
                  {alert.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{alert.value}</span>
                  <span className="text-sm text-muted-foreground">{alert.description}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/admin/usuarios")}
                className="p-4 text-left rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                <Users className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Gestión de Usuarios</h3>
                <p className="text-sm text-muted-foreground">Administra usuarios y roles</p>
              </button>
              
              <button
                onClick={() => navigate("/admin/vehiculos")}
                className="p-4 text-left rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                <Car className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Aprobar Vehículos</h3>
                <p className="text-sm text-muted-foreground">Revisa vehículos pendientes</p>
              </button>
              
              <button
                onClick={() => navigate("/admin/reportes")}
                className="p-4 text-left rounded-lg border border-border hover:bg-secondary transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-semibold text-foreground">Ver Reportes</h3>
                <p className="text-sm text-muted-foreground">Analíticas y métricas</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
