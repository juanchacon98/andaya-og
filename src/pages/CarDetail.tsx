import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MapPin, Calendar, Users, Fuel, Settings, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import carSedan from "@/assets/car-sedan.jpg";

const CarDetail = () => {
  const { id } = useParams();

  // Mock data - would come from API based on id
  const car = {
    id,
    image: carSedan,
    brand: "Honda",
    model: "Civic",
    year: 2023,
    pricePerDay: 45,
    location: "Bogotá, Colombia",
    rating: 4.8,
    type: "Sedán",
    description: "Vehículo en excelente estado, ideal para viajes en ciudad o carretera. Mantenimiento al día y listo para tu próxima aventura.",
    features: {
      transmission: "Automática",
      passengers: 5,
      fuel: "Gasolina",
    },
    owner: {
      name: "Carlos M.",
      rating: 4.9,
      verifiedSince: "2023",
    },
  };

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
                src={car.image}
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
                      <span className="font-semibold">{car.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{car.location}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {car.type}
                </Badge>
              </div>
              
              <p className="text-muted-foreground">{car.description}</p>
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
                      <div className="font-medium">{car.features.transmission}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Pasajeros</div>
                      <div className="font-medium">{car.features.passengers}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Combustible</div>
                      <div className="font-medium">{car.features.fuel}</div>
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
                      {car.owner.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{car.owner.name}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-accent text-accent" />
                        <span>{car.owner.rating}</span>
                      </div>
                      <span>Verificado desde {car.owner.verifiedSince}</span>
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
                    <span className="text-3xl font-bold">${car.pricePerDay}</span>
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
