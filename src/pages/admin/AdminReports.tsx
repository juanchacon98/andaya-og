import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Car, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";
import { ExchangeRateDisplay } from "@/components/admin/ExchangeRateDisplay";
import { formatBs } from "@/lib/currency";

const AdminReports = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalReservations: 0,
    activeReservations: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    averageBookingValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchReports();
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

  const fetchReports = async () => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        usersRes,
        newUsersRes,
        vehiclesRes,
        activeVehiclesRes,
        reservationsRes,
        activeReservationsRes,
        paymentsRes,
        monthlyPaymentsRes
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("reservations").select("id", { count: "exact", head: true }),
        supabase.from("reservations").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("payments").select("amount_total"),
        supabase.from("payments").select("amount_total").gte("created_at", firstDayOfMonth)
      ]);

      const totalRevenue = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount_total), 0) || 0;
      const monthlyRevenue = monthlyPaymentsRes.data?.reduce((sum, p) => sum + Number(p.amount_total), 0) || 0;
      const conversionRate = usersRes.count ? ((reservationsRes.count || 0) / usersRes.count * 100) : 0;
      const averageBookingValue = reservationsRes.count ? (totalRevenue / reservationsRes.count) : 0;

      setStats({
        totalUsers: usersRes.count || 0,
        newUsersThisMonth: newUsersRes.count || 0,
        totalVehicles: vehiclesRes.count || 0,
        activeVehicles: activeVehiclesRes.count || 0,
        totalReservations: reservationsRes.count || 0,
        activeReservations: activeReservationsRes.count || 0,
        totalRevenue,
        monthlyRevenue,
        conversionRate,
        averageBookingValue
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const reportCards = [
    {
      title: "Usuarios Totales",
      value: stats.totalUsers,
      subtitle: `+${stats.newUsersThisMonth} este mes`,
      icon: Users,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Vehículos Activos",
      value: stats.activeVehicles,
      subtitle: `${stats.totalVehicles} totales`,
      icon: Car,
      color: "text-green-600 bg-green-50"
    },
    {
      title: "Reservas en Curso",
      value: stats.activeReservations,
      subtitle: `${stats.totalReservations} totales`,
      icon: Calendar,
      color: "text-purple-600 bg-purple-50"
    },
    {
      title: "Ingresos del Mes",
      value: formatBs(stats.monthlyRevenue),
      subtitle: `${formatBs(stats.totalRevenue)} total`,
      icon: DollarSign,
      color: "text-yellow-600 bg-yellow-50"
    },
    {
      title: "Tasa de Conversión",
      value: `${stats.conversionRate.toFixed(1)}%`,
      subtitle: "Usuarios a reservas",
      icon: TrendingUp,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Valor Promedio",
      value: formatBs(stats.averageBookingValue),
      subtitle: "Por reserva",
      icon: AlertCircle,
      color: "text-pink-600 bg-pink-50"
    }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando reportes...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reportes y Analíticas</h1>
          <p className="text-muted-foreground mt-1">
            Métricas clave de la plataforma AndaYa
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((card, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  {(card.title === "Ingresos del Mes" || card.title === "Valor Promedio") && (
                    <ExchangeRateDisplay 
                      amountBs={card.title === "Ingresos del Mes" ? stats.monthlyRevenue : stats.averageBookingValue} 
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Resumen de Actividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <span className="text-sm font-medium">Usuarios registrados</span>
                <span className="text-2xl font-bold">{stats.totalUsers}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <span className="text-sm font-medium">Vehículos publicados</span>
                <span className="text-2xl font-bold">{stats.totalVehicles}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <span className="text-sm font-medium">Reservas completadas</span>
                <span className="text-2xl font-bold">{stats.totalReservations}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <span className="text-sm font-medium">Ingresos totales</span>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{formatBs(stats.totalRevenue)}</span>
                    <ExchangeRateDisplay amountBs={stats.totalRevenue} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
