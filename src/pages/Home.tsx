import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Star,
  Plane,
  CalendarDays,
  Navigation,
  Package
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { SearchDateRangePicker } from "@/components/SearchDateRangePicker";
import { Location } from "@/types/location";
import heroImage from "@/assets/hero-turo-style.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateTimeRange {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

const Home = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [recommendedCars, setRecommendedCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search form state
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange>({
    startDate: null,
    endDate: null,
    startTime: "10:00",
    endTime: "18:00",
  });

  useEffect(() => {
    fetchRecommendedVehicles();
  }, []);

  const fetchRecommendedVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(`
          *,
          vehicle_photos!vehicle_photos_vehicle_id_fkey (url)
        `)
        .eq("status", "active")
        .order("rating_avg", { ascending: false })
        .limit(6);

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
        type: vehicle.type as "sedan" | "suv" | "compact",
      }));

      setRecommendedCars(formattedVehicles.slice(0, 3));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      // Usar datos de respaldo en caso de error
      setRecommendedCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocation) {
      toast.error("Selecciona una ubicación de la lista");
      return;
    }
    
    if (!dateTimeRange.startDate || !dateTimeRange.endDate) {
      toast.error("Selecciona fechas y horarios");
      return;
    }
    
    // Construir ISO strings con fecha y hora en TZ Caracas
    const startISO = dayjs.tz(
      `${dayjs(dateTimeRange.startDate).format('YYYY-MM-DD')} ${dateTimeRange.startTime}`,
      'America/Caracas'
    ).toISOString();
    
    const endISO = dayjs.tz(
      `${dayjs(dateTimeRange.endDate).format('YYYY-MM-DD')} ${dateTimeRange.endTime}`,
      'America/Caracas'
    ).toISOString();
    
    const params = new URLSearchParams({
      q: selectedLocation.id,
      label: selectedLocation.label,
      lat: selectedLocation.lat.toString(),
      lng: selectedLocation.lng.toString(),
      from: startISO,
      to: endISO,
    });
    
    navigate(`/explorar?${params.toString()}`);
  };

  const categories = [
    { name: "Todos", icon: null },
    { name: "Aeropuertos", icon: Plane },
    { name: "Mensual", icon: CalendarDays },
    { name: "Cerca", icon: Navigation },
    { name: "Entregados", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section - Turo Style */}
      <section 
        className="relative h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight">
              Olvida la cola del alquiler
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/90">
              Alquila cualquier auto, donde quieras
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Dónde
                  </label>
                  <LocationAutocomplete
                    value={selectedLocation}
                    onChange={setSelectedLocation}
                    placeholder="Ciudad, aeropuerto..."
                    className="h-12 border-border"
                  />
                </div>
                
                {/* Date and Time Range */}
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Fechas y Horarios
                  </label>
                  <SearchDateRangePicker
                    value={dateTimeRange}
                    onChange={setDateTimeRange}
                    className="w-full border-border"
                  />
                </div>
                
                {/* Search Button */}
                <div className="md:col-span-1 flex items-end">
                  <Button 
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    size="lg"
                    disabled={!selectedLocation || !dateTimeRange.startDate || !dateTimeRange.endDate}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    {t('home.search_button')}
                  </Button>
                </div>
              </div>
            </form>
            
            {/* Secondary Button */}
            <div>
              <Link to="/explorar">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-foreground font-medium px-8"
                >
                  Conoce AndaYa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Chips */}
      <section className="border-b bg-background sticky top-0 z-40">
        <div className="container px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-full font-medium whitespace-nowrap transition-all
                  ${selectedCategory === category.name 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                  }
                `}
              >
                {category.icon && <category.icon className="h-4 w-4" />}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Cars */}
      <section className="py-16 bg-background">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Autos recomendados
            </h2>
            <p className="text-muted-foreground text-lg">
              Encuentra el vehículo perfecto para tu próximo viaje
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-10">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Cargando vehículos...</p>
                </div>
              </div>
            ) : recommendedCars.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-lg text-muted-foreground">{t('home.no_vehicles')}</p>
              </div>
            ) : (
              recommendedCars.map((car) => (
                <CarCard key={car.id} {...car} />
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <Link to="/explorar">
              <Button 
                size="lg" 
                variant="outline"
                className="font-medium px-8"
              >
                {t('home.view_all')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works - Simple Version */}
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Alquilar un auto es fácil y rápido con AndaYa
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { number: "1", title: "Busca", description: "Encuentra el auto perfecto cerca de ti" },
              { number: "2", title: "Reserva", description: "Elige las fechas y confirma tu reserva" },
              { number: "3", title: "Recoge", description: "Coordina con el dueño y recoge el auto" },
              { number: "4", title: "Disfruta", description: "¡Anda Ya! Disfruta tu viaje" },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Únete a miles de venezolanos que ya están usando AndaYa
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registro">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 font-semibold px-8"
              >
                Crear cuenta gratis
              </Button>
            </Link>
            <Link to="/explorar">
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8"
              >
                Explorar autos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
