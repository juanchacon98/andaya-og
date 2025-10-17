import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Set your Mapbox token here - user needs to add their own
mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1kZW1vIiwiYSI6ImNsejBhMjN4czA1MWkya3M5ZGJ4c3lqN3cifQ.8P8L8vVXqLqZKqZqZqZqZg';

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

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">${vehicle.title}</h3>
              <p style="color: hsl(var(--primary));">$${vehicle.price_per_day.toLocaleString()}/día</p>
            </div>
          `);

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

  return (
    <div className="space-y-4">
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