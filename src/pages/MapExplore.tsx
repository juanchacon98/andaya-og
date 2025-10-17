import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VehicleMap from "@/components/VehicleMap";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Vehicle {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price_per_day: number;
  brand: string;
  model: string;
  year: number;
  city: string;
}

const MapExplore = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, title, lat, lng, price_per_day, brand, model, year, city")
        .eq("status", "active")
        .not("lat", "is", null)
        .not("lng", "is", null);

      if (error) throw error;

      setVehicles(data || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container px-4 mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Explora Carros Cerca de Ti</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Encuentra vehículos disponibles en el mapa
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                Cargando mapa...
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <VehicleMap readOnly vehicles={vehicles} />
                <div className="mt-4 text-sm text-muted-foreground">
                  {vehicles.length} vehículos disponibles en el mapa
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MapExplore;