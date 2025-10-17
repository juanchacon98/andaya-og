import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import carSedan from "@/assets/car-sedan.jpg";
import carSuv from "@/assets/car-suv.jpg";
import carCompact from "@/assets/car-compact.jpg";

const Explore = () => {
  const [location, setLocation] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [priceRange, setPriceRange] = useState([0]);

  // Mock data for cars
  const cars = [
    {
      id: "1",
      image: carSedan,
      brand: "Honda",
      model: "Civic",
      year: 2023,
      pricePerDay: 45,
      location: "Bogotá, Colombia",
      rating: 4.8,
      type: "Sedán",
    },
    {
      id: "2",
      image: carSuv,
      brand: "Mazda",
      model: "CX-5",
      year: 2022,
      pricePerDay: 65,
      location: "Medellín, Colombia",
      rating: 4.9,
      type: "SUV",
    },
    {
      id: "3",
      image: carCompact,
      brand: "Chevrolet",
      model: "Spark",
      year: 2024,
      pricePerDay: 30,
      location: "Cali, Colombia",
      rating: 4.7,
      type: "Compacto",
    },
    {
      id: "4",
      image: carSedan,
      brand: "Toyota",
      model: "Corolla",
      year: 2023,
      pricePerDay: 50,
      location: "Cartagena, Colombia",
      rating: 4.9,
      type: "Sedán",
    },
    {
      id: "5",
      image: carSuv,
      brand: "Nissan",
      model: "Qashqai",
      year: 2022,
      pricePerDay: 60,
      location: "Barranquilla, Colombia",
      rating: 4.6,
      type: "SUV",
    },
    {
      id: "6",
      image: carCompact,
      brand: "Kia",
      model: "Picanto",
      year: 2024,
      pricePerDay: 35,
      location: "Pereira, Colombia",
      rating: 4.8,
      type: "Compacto",
    },
  ];

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
                  <SelectItem value="compact">Compacto</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price">Precio máximo por día: ${priceRange[0]}</Label>
              <Slider
                id="price"
                min={0}
                max={200}
                step={5}
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
        <div className="mb-4 text-muted-foreground">
          Mostrando {cars.length} vehículos
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} {...car} />
          ))}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Explore;
