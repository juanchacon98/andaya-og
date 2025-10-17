import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";

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

const CarCard = ({
  id,
  image,
  brand,
  model,
  year,
  pricePerDay,
  location,
  rating,
  type,
}: CarCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={image}
          alt={`${brand} ${model}`}
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {brand} {model}
            </h3>
            <p className="text-sm text-muted-foreground">{year}</p>
          </div>
          <Badge variant="secondary">{type}</Badge>
        </div>
        
        <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        
        <div className="mb-4 flex items-center gap-1">
          <Star className="h-4 w-4 fill-accent text-accent" />
          <span className="font-semibold">{rating.toFixed(1)}</span>
        </div>
        
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${pricePerDay}</span>
          <span className="text-sm text-muted-foreground">/día</span>
        </div>
      </CardContent>
      
      <CardFooter className="gap-2 p-4 pt-0">
        <Link to={`/carro/${id}`} className="flex-1">
          <Button className="w-full">Ver detalles</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CarCard;
