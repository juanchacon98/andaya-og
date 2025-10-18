import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter } from "lucide-react";

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total: number;
  created_at: string;
  renter: {
    full_name: string;
  };
  owner: {
    full_name: string;
  };
  vehicle: {
    brand: string;
    model: string;
  };
}

const AdminReservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchReservations();
  }, []);

  useEffect(() => {
    let filtered = reservations.filter(r =>
      r.renter.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle.brand.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReservations(filtered);
  }, [search, statusFilter, reservations]);

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

  const fetchReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select(`
          *,
          renter:profiles!reservations_renter_id_fkey (full_name),
          owner:profiles!reservations_owner_id_fkey (full_name),
          vehicle:vehicles!reservations_vehicle_id_fkey (brand, model)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReservations(data as any || []);
      setFilteredReservations(data as any || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      case "finished": return "bg-blue-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      approved: "Aprobada",
      pending: "Pendiente",
      rejected: "Rechazada",
      finished: "Finalizada",
      cancelled: "Cancelada"
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando reservas...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Reservas</h1>
          <p className="text-muted-foreground mt-1">
            Administra todas las reservas de la plataforma
          </p>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por arrendatario, dueño o vehículo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="approved">Aprobadas</SelectItem>
                  <SelectItem value="finished">Finalizadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Reservas ({filteredReservations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Arrendatario</TableHead>
                    <TableHead>Dueño</TableHead>
                    <TableHead>Fechas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Creada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => (
                    <TableRow key={reservation.id}>
                      <TableCell className="font-medium">
                        {reservation.vehicle?.brand} {reservation.vehicle?.model}
                      </TableCell>
                      <TableCell>{reservation.renter?.full_name || "N/A"}</TableCell>
                      <TableCell>{reservation.owner?.full_name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(reservation.start_date).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(reservation.end_date).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(reservation.status)}>
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${reservation.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReservations;
