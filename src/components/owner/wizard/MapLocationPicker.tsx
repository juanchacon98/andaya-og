import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink } from "lucide-react";

interface MapLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  city: string;
}

export function MapLocationPicker({ lat, lng, onLocationChange, city }: MapLocationPickerProps) {
  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border rounded-lg p-4">
        <div className="flex items-start gap-3 mb-4">
          <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium mb-1">Ubicación de recogida</p>
            <p className="text-muted-foreground text-xs">
              Introduce las coordenadas donde los arrendatarios recogerán el vehículo. 
              Puedes obtenerlas desde Google Maps haciendo clic derecho en el lugar.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="lat-input">Latitud</Label>
            <Input
              id="lat-input"
              type="number"
              step="0.000001"
              value={lat || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  onLocationChange(parseFloat(value), lng || 0);
                }
              }}
              placeholder="10.4806"
            />
          </div>
          <div>
            <Label htmlFor="lng-input">Longitud</Label>
            <Input
              id="lng-input"
              type="number"
              step="0.000001"
              value={lng || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  onLocationChange(lat || 0, parseFloat(value));
                }
              }}
              placeholder="-66.9036"
            />
          </div>
        </div>

        {lat != null && lng != null && typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p>📍 Ubicación seleccionada: {lat.toFixed(6)}, {lng.toFixed(6)}</p>
          </div>
        )}
      </div>

      <a 
        href="https://www.google.com/maps" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-xs text-primary hover:underline"
      >
        <MapPin className="h-3 w-3" />
        Abrir Google Maps para obtener coordenadas
        <ExternalLink className="h-3 w-3" />
      </a>
      
      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
        <p className="font-medium mb-1">💡 Cómo obtener las coordenadas:</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Haz clic en el enlace de arriba para abrir Google Maps</li>
          <li>Busca la ubicación de recogida</li>
          <li>Haz clic derecho en el punto exacto del mapa</li>
          <li>Las coordenadas aparecen arriba, haz clic para copiarlas</li>
          <li>Pégalas aquí (primer número = latitud, segundo = longitud)</li>
        </ol>
      </div>
    </div>
  );
}