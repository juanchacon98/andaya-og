import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MapLocationPickerProps {
  lat: number | null;
  lng: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  city: string;
}

export function MapLocationPicker({ lat, lng, onLocationChange, city }: MapLocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [isTokenSet, setIsTokenSet] = useState(false);

  useEffect(() => {
    // Check for Mapbox token
    const token = import.meta.env.VITE_MAPBOX_TOKEN || '';
    if (token) {
      setMapboxToken(token);
      setIsTokenSet(true);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isTokenSet || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    // Default to Venezuela center or provided coordinates
    const initialLat = lat || 10.4806;
    const initialLng = lng || -66.9036;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: lat && lng ? 14 : 12,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder for search (optional, requires @mapbox/mapbox-gl-geocoder)
    // For now, users can click on the map to set location

    // Create draggable marker
    marker.current = new mapboxgl.Marker({
      draggable: true,
      color: '#7C3AED',
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map.current);

    // Update coordinates when marker is dragged
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        onLocationChange(lngLat.lat, lngLat.lng);
      }
    });

    // Update marker position on map click
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
        onLocationChange(lat, lng);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [isTokenSet, mapboxToken]);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (marker.current && lat !== null && lng !== null) {
      marker.current.setLngLat([lng, lat]);
      if (map.current) {
        map.current.flyTo({ center: [lng, lat], zoom: 14 });
      }
    }
  }, [lat, lng]);

  if (!isTokenSet) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
            Token de Mapbox requerido
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            Para usar el selector de ubicación, necesitas un token de Mapbox.
          </p>
          <ol className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside mb-3">
            <li>
              Ve a{' '}
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                account.mapbox.com/access-tokens
              </a>
            </li>
            <li>Copia tu token público (Default public token)</li>
            <li>Pégalo abajo y guárdalo</li>
          </ol>
          
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Token de Mapbox</Label>
            <Input
              id="mapbox-token"
              type="text"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbHh4eHh4eHgifQ..."
            />
            <Button 
              onClick={() => {
                if (mapboxToken.startsWith('pk.')) {
                  setIsTokenSet(true);
                }
              }}
              disabled={!mapboxToken.startsWith('pk.')}
            >
              Usar este token
            </Button>
          </div>
        </div>

        {/* Fallback manual inputs */}
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            O introduce las coordenadas manualmente:
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lat-manual">Latitud</Label>
              <Input
                id="lat-manual"
                type="number"
                step="0.000001"
                value={lat || ''}
                onChange={(e) => onLocationChange(parseFloat(e.target.value), lng || 0)}
                placeholder="10.4806"
              />
            </div>
            <div>
              <Label htmlFor="lng-manual">Longitud</Label>
              <Input
                id="lng-manual"
                type="number"
                step="0.000001"
                value={lng || ''}
                onChange={(e) => onLocationChange(lat || 0, parseFloat(e.target.value))}
                placeholder="-66.9036"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div 
          ref={mapContainer} 
          className="w-full h-[400px] rounded-lg border shadow-sm"
        />
        <div className="absolute top-4 left-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Ubica tu vehículo</p>
              <p className="text-muted-foreground text-xs">
                Haz clic en el mapa o arrastra el marcador
              </p>
            </div>
          </div>
        </div>
      </div>

      {lat !== null && lng !== null && (
        <div className="text-sm text-muted-foreground">
          <p>📍 Ubicación seleccionada:</p>
          <p className="font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
}