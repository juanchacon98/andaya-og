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
import { useTranslation } from "react-i18next";

const Explore = () => {
  const { t } = useTranslation();
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
        pricePerDay: vehicle.price_bs || 0,
        location: `${vehicle.city || "Venezuela"}`,
        rating: vehicle.rating_avg || 0,
        type: vehicle.type,
      }));

      setCars(formattedVehicles);
    } catch (error: any) {
      console.error("Error fetching vehicles:", error);
      toast.error(t('explore.error_loading'));
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
      
      <div className="container py-8" style={{ paddingTop: 'calc(var(--app-header-h) + 2rem)' }}>
        <h1 className="mb-8 text-4xl font-bold">{t('explore.title')}</h1>
        
        {/* Filters */}
        <div className="mb-8 rounded-lg border bg-card p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="location">{t('explore.location_label')}</Label>
              <Input
                id="location"
                placeholder={t('explore.location_placeholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType">{t('explore.vehicle_type_label')}</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder={t('explore.vehicle_type_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('explore.vehicle_types.all')}</SelectItem>
                  <SelectItem value="sedan">{t('explore.vehicle_types.sedan')}</SelectItem>
                  <SelectItem value="suv">{t('explore.vehicle_types.suv')}</SelectItem>
                  <SelectItem value="hatchback">{t('explore.vehicle_types.hatchback')}</SelectItem>
                  <SelectItem value="van">{t('explore.vehicle_types.van')}</SelectItem>
                  <SelectItem value="pickup">{t('explore.vehicle_types.pickup')}</SelectItem>
                  <SelectItem value="coupe">{t('explore.vehicle_types.coupe')}</SelectItem>
                  <SelectItem value="moto">{t('explore.vehicle_types.moto')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
            <Label htmlFor="price">{t('explore.price_label')}: Bs. {priceRange[0] === 0 ? t('explore.no_limit') : priceRange[0].toLocaleString()}</Label>
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
            <Button>{t('explore.apply_filters')}</Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">{t('explore.loading')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-muted-foreground">
              {t('explore.showing_vehicles', { count: filteredCars.length })}
            </div>
            
            {filteredCars.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-lg text-muted-foreground">{t('explore.no_results')}</p>
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
