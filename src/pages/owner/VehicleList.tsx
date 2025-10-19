import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Zap, AlertCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { QuickEditVehicle } from "@/components/owner/QuickEditVehicle";
import { VehicleReservationsDialog } from "@/components/owner/VehicleReservationsDialog";

interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  price_bs: number;
  status: string;
  city: string | null;
  kilometraje: number | null;
  created_at: string;
}

export default function VehicleList() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [quickEditVehicle, setQuickEditVehicle] = useState<Vehicle | null>(null);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [reservationsVehicle, setReservationsVehicle] = useState<Vehicle | null>(null);
  const [reservationsOpen, setReservationsOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      // Fetch KYC status
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_verifications')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (kycError && kycError.code !== 'PGRST116') throw kycError;
      setKycStatus(kycData?.status || null);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar información');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Activo</Badge>;
      case 'pending_review':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      case 'paused':
        return <Badge variant="outline">Pausado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filterVehicles = (status: string | null) => {
    if (!status) return vehicles;
    return vehicles.filter(v => v.status === status);
  };

  const handleQuickEdit = (vehicle: Vehicle) => {
    setQuickEditVehicle(vehicle);
    setQuickEditOpen(true);
  };

  const handleViewReservations = (vehicle: Vehicle) => {
    setReservationsVehicle(vehicle);
    setReservationsOpen(true);
  };

  const VehicleTable = ({ vehicles }: { vehicles: Vehicle[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehículo</TableHead>
          <TableHead>Ciudad</TableHead>
          <TableHead>Precio/día</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vehicles.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No hay vehículos en esta categoría
            </TableCell>
          </TableRow>
        ) : (
          vehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{vehicle.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {vehicle.brand} {vehicle.model} {vehicle.year}
                  </div>
                </div>
              </TableCell>
              <TableCell>{vehicle.city || '-'}</TableCell>
              <TableCell>Bs {vehicle.price_bs}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewReservations(vehicle)}
                    title="Ver reservas"
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleQuickEdit(vehicle)}
                    title="Edición rápida"
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  <Link to={`/owner/vehicles/${vehicle.id}/edit`}>
                    <Button variant="outline" size="sm" title="Edición completa">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const isKycVerified = kycStatus === 'verified';

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Mis Vehículos</h1>
              <p className="text-muted-foreground">Gestiona tus publicaciones</p>
            </div>
            <div className="flex gap-2">
              <Link to="/owner/mis-reservas-autos">
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Reservas de mis autos
                </Button>
              </Link>
              {isKycVerified ? (
                <Link to="/owner/vehicles/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar nuevo vehículo
                  </Button>
                </Link>
              ) : (
                <Button disabled className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar nuevo vehículo
                </Button>
              )}
            </div>
          </div>

          {vehicles.length === 0 && !isKycVerified && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Para poder publicar tus vehículos, primero debes completar tu verificación de identidad.
              </AlertDescription>
            </Alert>
          )}

          {vehicles.length === 0 && isKycVerified && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-muted-foreground mb-4">No tienes vehículos publicados</p>
                <Link to="/owner/vehicles/new">
                  <Button size="lg" className="gap-2">
                    <Plus className="h-5 w-5" />
                    Publicar mi primer vehículo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {vehicles.length === 0 && !isKycVerified && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-muted-foreground mb-4">No tienes vehículos publicados</p>
                <Link to="/kyc">
                  <Button size="lg" className="gap-2">
                    Verificar mi identidad
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {vehicles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tus Vehículos</CardTitle>
                <CardDescription>
                  Total: {vehicles.length} vehículo{vehicles.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="all">Todos ({vehicles.length})</TabsTrigger>
                  <TabsTrigger value="active">Activos ({filterVehicles('active').length})</TabsTrigger>
                  <TabsTrigger value="pending">Pendientes ({filterVehicles('pending_review').length})</TabsTrigger>
                  <TabsTrigger value="paused">Pausados ({filterVehicles('paused').length})</TabsTrigger>
                  <TabsTrigger value="rejected">Rechazados ({filterVehicles('rejected').length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <VehicleTable vehicles={vehicles} />
                </TabsContent>

                <TabsContent value="active" className="mt-4">
                  <VehicleTable vehicles={filterVehicles('active')} />
                </TabsContent>

                <TabsContent value="pending" className="mt-4">
                  <VehicleTable vehicles={filterVehicles('pending_review')} />
                </TabsContent>

                <TabsContent value="paused" className="mt-4">
                  <VehicleTable vehicles={filterVehicles('paused')} />
                </TabsContent>

                  <TabsContent value="rejected" className="mt-4">
                    <VehicleTable vehicles={filterVehicles('rejected')} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {quickEditVehicle && (
        <QuickEditVehicle
          vehicle={quickEditVehicle}
          open={quickEditOpen}
          onOpenChange={setQuickEditOpen}
          onSuccess={fetchData}
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

      <Footer />
    </div>
  );
}
