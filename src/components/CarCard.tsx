import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";

interface CarCardProps {
  id: string;
  image: string;
  brand: string;
  model: string;
  year: number;
  pricePerDay: number;
  location: string;
  rating: number;
  type: string;
}

const CarCard = ({ id, image, brand, model, year, pricePerDay, location, rating }: CarCardProps) => {
  return (
    <Link to={`/carro/${id}`} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 group border border-border bg-card">
        <div className="relative h-56 overflow-hidden bg-muted">
          <img 
            src={image} 
            alt={`${brand} ${model}`} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {brand} {model}
              </h3>
              <p className="text-sm text-muted-foreground">{year}</p>
            </div>
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-lg">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold text-sm">{rating > 0 ? rating : "N/A"}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-baseline gap-1 pt-3 border-t border-border">
            <span className="text-2xl font-bold text-foreground">
              ${pricePerDay?.toLocaleString() || 0}
            </span>
            <span className="text-sm text-muted-foreground">/ día</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CarCard;
