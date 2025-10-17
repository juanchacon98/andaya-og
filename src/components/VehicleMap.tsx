import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsejBhMjN4czA1MWkya3M5ZGJ4c3lqN3cifQ.8P8L8vVXqLqZKqZqZqZqZg';

// Check if Mapbox token is configured
if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsejBhMjN4czA1MWkya3M5ZGJ4c3lqN3cifQ.8P8L8vVXqLqZKqZqZqZqZg') {
  console.error('⚠️ MAPBOX TOKEN REQUERIDO: Obtén tu token en https://account.mapbox.com/access-tokens/');
}

mapboxgl.accessToken = MAPBOX_TOKEN;

interface VehicleMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  readOnly?: boolean;
  vehicles?: Array<{
    id: string;
    title: string;
    lat: number;
    lng: number;
    price_per_day: number;
  }>;
}

const VehicleMap = ({ 
  initialLat = 4.7110, 
  initialLng = -74.0721, 
  onLocationChange,
  readOnly = false,
  vehicles = []
}: VehicleMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: 12,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    if (!readOnly) {
      // Add initial marker
      marker.current = new mapboxgl.Marker({
        draggable: true,
      })
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

      // Handle marker drag
      marker.current.on('dragend', () => {
        const lngLat = marker.current!.getLngLat();
        onLocationChange?.(lngLat.lat, lngLat.lng);
        reverseGeocode(lngLat.lat, lngLat.lng);
      });

      // Handle map click to move marker
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        marker.current!.setLngLat([lng, lat]);
        onLocationChange?.(lat, lng);
        reverseGeocode(lat, lng);
      });

      // Initial reverse geocode
      reverseGeocode(initialLat, initialLng);
    } else {
      // Display vehicles
      vehicles.forEach((vehicle) => {
        if (vehicle.lat && vehicle.lng) {
          const el = document.createElement('div');
          el.className = 'vehicle-marker';
          el.style.cssText = `
            background-color: hsl(var(--primary));
            width: 30px;
            height: 30px;
            border-radius: 50%;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          `;

          // Create popup content safely using DOM methods to prevent XSS
          const popupDiv = document.createElement('div');
          popupDiv.style.padding = '8px';

          const title = document.createElement('h3');
          title.style.fontWeight = 'bold';
          title.style.marginBottom = '4px';
          title.textContent = vehicle.title; // Safe - sets text, not HTML

          const price = document.createElement('p');
          price.style.color = 'hsl(var(--primary))';
          price.textContent = `$${vehicle.price_per_day.toLocaleString()}/día`;

          popupDiv.appendChild(title);
          popupDiv.appendChild(price);

          const popup = new mapboxgl.Popup({ offset: 25 })
            .setDOMContent(popupDiv);

          new mapboxgl.Marker(el)
            .setLngLat([vehicle.lng, vehicle.lat])
            .setPopup(popup)
            .addTo(map.current!);
        }
      });

      // Fit bounds to show all vehicles
      if (vehicles.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        vehicles.forEach((v) => {
          if (v.lat && v.lng) {
            bounds.extend([v.lng, v.lat]);
          }
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      if (data.features && data.features[0]) {
        setAddress(data.features[0].place_name);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleAddressSearch = async () => {
    if (!address) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&country=CO`
      );
      const data = await response.json();
      
      if (data.features && data.features[0]) {
        const [lng, lat] = data.features[0].center;
        map.current?.flyTo({ center: [lng, lat], zoom: 14 });
        marker.current?.setLngLat([lng, lat]);
        onLocationChange?.(lat, lng);
      }
    } catch (error) {
      console.error('Error geocoding:', error);
    }
  };

  // Show warning if using demo token
  const isDemoToken = !import.meta.env.VITE_MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsejBhMjN4czA1MWkya3M5ZGJ4c3lqN3cifQ.8P8L8vVXqLqZKqZqZqZqZg';

  return (
    <div className="space-y-4">
      {isDemoToken && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Configuración requerida:</strong> Para usar el mapa, necesitas agregar tu token de Mapbox.
            <br />
            1. Obtén un token gratis en <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener" className="underline">Mapbox</a>
            <br />
            2. Agrega <code className="bg-yellow-100 px-1 rounded">VITE_MAPBOX_TOKEN=tu_token_aqui</code> en el archivo .env
          </p>
        </div>
      )}
      
      {!readOnly && (
        <div className="space-y-2">
          <Label htmlFor="address">Buscar dirección</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              type="text"
              placeholder="Ej: Carrera 7 #32-16, Bogotá"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            />
            <Button type="button" onClick={handleAddressSearch}>
              Buscar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            También puedes hacer clic en el mapa o arrastrar el marcador
          </p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg shadow-lg" />
    </div>
  );
};

export default VehicleMap;
