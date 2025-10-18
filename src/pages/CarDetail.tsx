import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, Users, Fuel, Settings, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CarDetail = () => {
  const { id } = useParams();
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCarDetails();
    }
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_photos (url, sort_order),
          profiles!vehicles_owner_id_fkey (full_name, id)
        `)
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Vehículo no encontrado");
        return;
      }

      setCar(data);
    } catch (error) {
      console.error("Error loading vehicle:", error);
      toast.error("Error al cargar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Vehículo no encontrado</h2>
            <p className="text-muted-foreground mb-6">El vehículo que buscas no está disponible.</p>
            <Link to="/explorar">
              <Button>Explorar vehículos</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const mainPhoto = car.vehicle_photos?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800";

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container py-8">
        <Link to="/explorar" className="mb-6 inline-flex items-center gap-2 text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver a explorar
        </Link>
        
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Image gallery */}
            <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={mainPhoto}
                alt={`${car.brand} ${car.model}`}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Car info */}
            <div className="mb-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold">
                    {car.brand} {car.model} {car.year}
                  </h1>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="font-semibold">{car.rating_avg > 0 ? car.rating_avg.toFixed(1) : "Sin valoraciones"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{car.city || "Venezuela"}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {car.type}
                </Badge>
              </div>
              
              <p className="text-muted-foreground">{car.description || car.title}</p>
            </div>
            
            {/* Specifications */}
            <Card>
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Especificaciones</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Transmisión</div>
                      <div className="font-medium">{car.transmission || "Manual"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pasajeros</div>
                      <div className="font-medium">5</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Combustible</div>
                      <div className="font-medium">{car.fuel_type || "Gasolina"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Owner info */}
            <Card className="mt-6">
              <CardContent className="p-6">
                <h2 className="mb-4 text-xl font-semibold">Sobre el dueño</h2>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {car.profiles?.full_name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{car.profiles?.full_name || "Propietario"}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Propietario verificado</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Bs {car.price_bs?.toLocaleString() || 0}</span>
                    <span className="text-muted-foreground">/día</span>
                  </div>
                </div>
                
                <div className="mb-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de inicio</label>
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Selecciona una fecha</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha de devolución</label>
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Selecciona una fecha</span>
                    </div>
                  </div>
                </div>
                
                <Button className="mb-4 w-full" size="lg">
                  Reservar ahora
                </Button>
                
                <Button variant="outline" className="w-full">
                  Contactar al dueño
                </Button>
                
                <div className="mt-6 rounded-md bg-secondary/50 p-4 text-center text-sm">
                  <p className="text-muted-foreground">
                    No se te cobrará hasta confirmar tu reserva
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CarDetail;
