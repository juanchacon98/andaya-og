import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Filter, Eye, CheckCircle, XCircle, Edit, Pause } from "lucide-react";
import { toast } from "sonner";
import { VehicleEditDialog } from "@/components/admin/VehicleEditDialog";
import { VehicleRejectDialog } from "@/components/admin/VehicleRejectDialog";

interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status: string;
  price_per_day: number;
  city: string;
  owner_id: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

const AdminVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [rejectingVehicleId, setRejectingVehicleId] = useState<string | null>(null);
  const [rejectingVehicleName, setRejectingVehicleName] = useState("");

  useEffect(() => {
    checkAdminAccess();
    fetchVehicles();
  }, []);

  useEffect(() => {
    let filtered = vehicles.filter(v =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.profiles.full_name?.toLowerCase().includes(search.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    setFilteredVehicles(filtered);
  }, [search, statusFilter, vehicles]);

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

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          profiles!vehicles_owner_id_fkey (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVehicles(data as any || []);
      setFilteredVehicles(data as any || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  const updateVehicleStatus = async (id: string, newStatus: string) => {
    try {
      // Si se está aprobando, verificar KYC del propietario
      if (newStatus === "active") {
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return;

        const { data: kycData, error: kycError } = await supabase
          .from("kyc_verifications")
          .select("status")
          .eq("user_id", vehicle.owner_id)
          .maybeSingle();

        if (kycError || !kycData || kycData.status !== "verified") {
          toast.error("No se puede aprobar: el propietario no tiene KYC verificado");
          return;
        }
      }

      const { error } = await supabase
        .from("vehicles")
        .update({ status: newStatus as "active" | "paused" | "pending_review" | "rejected" })
        .eq("id", id);

      if (error) throw error;

      const statusLabels: Record<string, string> = {
        active: "aprobado",
        paused: "pausado",
        rejected: "rechazado"
      };

      toast.success(`Vehículo ${statusLabels[newStatus] || "actualizado"}`);
      fetchVehicles();
    } catch (error) {
      console.error("Error updating vehicle:", error);
      toast.error("Error al actualizar vehículo");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending_review": return "warning";
      case "inactive": return "secondary";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Activo";
      case "pending_review": return "Pendiente";
      case "paused": return "Pausado";
      case "rejected": return "Rechazado";
      default: return status;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando vehículos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Vehículos</h1>
          <p className="text-muted-foreground mt-1">
            Administra y aprueba vehículos registrados
          </p>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por modelo, marca, dueño..."
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
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="pending_review">Pendientes</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="rejected">Rechazados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Vehículos ({filteredVehicles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Dueño</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Precio/día</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vehicle.brand} {vehicle.model}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.year} • {vehicle.type}</p>
                        </div>
                      </TableCell>
                      <TableCell>{vehicle.profiles?.full_name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(vehicle.status) as any}>
                          {getStatusLabel(vehicle.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>${vehicle.price_per_day.toLocaleString()}</TableCell>
                      <TableCell>{vehicle.city || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(vehicle.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Ver detalles */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/carro/${vehicle.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Editar - disponible para todos los estados */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVehicle(vehicle)}
                            title="Editar vehículo"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          {/* Acciones según estado */}
                          {vehicle.status === "pending_review" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => updateVehicleStatus(vehicle.id, "active")}
                                title="Aprobar"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setRejectingVehicleId(vehicle.id);
                                  setRejectingVehicleName(`${vehicle.brand} ${vehicle.model}`);
                                }}
                                title="Rechazar"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {vehicle.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              onClick={() => updateVehicleStatus(vehicle.id, "paused")}
                              title="Pausar"
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {vehicle.status === "paused" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateVehicleStatus(vehicle.id, "active")}
                              title="Activar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {/* Diálogos */}
        <VehicleEditDialog
          vehicle={editingVehicle}
          open={!!editingVehicle}
          onOpenChange={(open) => !open && setEditingVehicle(null)}
          onSuccess={fetchVehicles}
        />
        
        <VehicleRejectDialog
          vehicleId={rejectingVehicleId}
          vehicleName={rejectingVehicleName}
          open={!!rejectingVehicleId}
          onOpenChange={(open) => !open && setRejectingVehicleId(null)}
          onSuccess={fetchVehicles}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminVehicles;
