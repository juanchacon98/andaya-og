import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Car, FileText, Settings, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    vehicles: 0,
    reservations: 0,
    incidents: 0
  });
  const [loading, setLoading] = useState(true);

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
      .eq("user_id", user.id)
      .eq("role", "admin_primary");

    if (!roles || roles.length === 0) {
      navigate("/");
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, vehiclesRes, reservationsRes, incidentsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("vehicles").select("id", { count: "exact", head: true }),
        supabase.from("reservations").select("id", { count: "exact", head: true }),
        supabase.from("incidents").select("id", { count: "exact", head: true })
      ]);

      setStats({
        users: usersRes.count || 0,
        vehicles: vehiclesRes.count || 0,
        reservations: reservationsRes.count || 0,
        incidents: incidentsRes.count || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Usuarios",
      value: stats.users,
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      link: "/admin/usuarios"
    },
    {
      title: "Vehículos",
      value: stats.vehicles,
      icon: Car,
      color: "from-green-500 to-emerald-500",
      link: "/admin/usuarios"
    },
    {
      title: "Reservas",
      value: stats.reservations,
      icon: TrendingUp,
      color: "from-yellow-500 to-orange-500",
      link: "/admin/usuarios"
    },
    {
      title: "Incidentes",
      value: stats.incidents,
      icon: FileText,
      color: "from-red-500 to-pink-500",
      link: "/admin/usuarios"
    }
  ];

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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 bg-gradient-to-b from-background to-secondary/30">
        <div className="container px-4 mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
              <p className="text-muted-foreground">
                Gestiona tu plataforma AndaYa
              </p>
            </div>
            <Button 
              onClick={() => navigate("/admin/usuarios")}
              size="lg"
              className="hidden sm:flex"
            >
              <Users className="mr-2 h-5 w-5" />
              Ver Usuarios
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <Card 
                key={index}
                className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => navigate(stat.link)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Administra usuarios, verifica KYC y gestiona roles
                </p>
                <Button onClick={() => navigate("/admin/usuarios")} className="w-full">
                  Ver Usuarios
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración UI/UX
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Personaliza colores, tipografía y estilos de la plataforma
                </p>
                <Button onClick={() => navigate("/admin/configuracion")} className="w-full">
                  Configurar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
