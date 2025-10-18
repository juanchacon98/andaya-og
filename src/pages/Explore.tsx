import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Explore = () => {
  const [location, setLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [priceRange, setPriceRange] = useState([0]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_photos!vehicle_photos_vehicle_id_fkey (url)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedVehicles = (data || []).map((vehicle: any) => ({
        id: vehicle.id,
        image: vehicle.vehicle_photos?.[0]?.url || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800",
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        pricePerDay: vehicle.price_per_day,
        location: `${vehicle.city || "Venezuela"}`,
        rating: vehicle.rating_avg || 5.0,
        type: vehicle.type,
      }));

      setCars(formattedVehicles);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast.error("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar vehículos
  const filteredCars = cars.filter(car => {
    const matchesLocation = !location || car.location.toLowerCase().includes(location.toLowerCase());
    const matchesType = vehicleType === "all" || car.type === vehicleType;
    const matchesPrice = priceRange[0] === 0 || car.pricePerDay <= priceRange[0];
    return matchesLocation && matchesType && matchesPrice;
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="container py-8">
        <h1 className="mb-8 text-4xl font-bold">Explora vehículos disponibles</h1>
        
        {/* Filters */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="¿Dónde buscas?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Tipo de vehículo</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sedan">Sedán</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="coupe">Coupé</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
            <Label htmlFor="price">Precio máximo por día: Bs. {priceRange[0] === 0 ? "Sin límite" : priceRange[0].toLocaleString()}</Label>
            <Slider
              id="price"
              min={0}
              max={500}
              step={10}
              value={priceRange}
              onValueChange={setPriceRange}
              className="mt-2"
            />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button>Aplicar filtros</Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Cargando vehículos...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-muted-foreground">
              Mostrando {filteredCars.length} vehículos
            </div>
            
            {filteredCars.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">No se encontraron vehículos que coincidan con tu búsqueda</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredCars.map((car) => (
                  <CarCard key={car.id} {...car} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Explore;
