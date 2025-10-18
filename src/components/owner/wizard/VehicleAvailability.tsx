import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { MapLocationPicker } from "./MapLocationPicker";

interface VehicleAvailabilityProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function VehicleAvailability({ data, onChange }: VehicleAvailabilityProps) {
  const deliveryZones = [
    'Caracas - Chacao',
    'Caracas - Baruta',
    'Caracas - El Hatillo',
    'Caracas - Sucre',
    'Caracas - Libertador',
    'Miranda - Los Teques',
    'Vargas - La Guaira',
  ];

  const toggleDeliveryZone = (zone: string) => {
    const currentZones = data.delivery_zones || [];
    const newZones = currentZones.includes(zone)
      ? currentZones.filter((z: string) => z !== zone)
      : [...currentZones, zone];
    onChange('delivery_zones', newZones);
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-3">Tipo de entrega</h4>
        <Select 
          value={data.delivery_type || 'both'} 
          onValueChange={(v) => onChange('delivery_type', v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pickup">Solo recogida en ubicación fija</SelectItem>
            <SelectItem value="delivery">Solo entrega a domicilio</SelectItem>
            <SelectItem value="both">Ambas opciones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.delivery_type === 'delivery' || data.delivery_type === 'both') && (
        <>
          <div>
            <Label htmlFor="delivery_cost_bs">Costo de entrega (Bs)</Label>
            <Input
              id="delivery_cost_bs"
              type="number"
              step="0.01"
              value={data.delivery_cost_bs || ''}
              onChange={(e) => onChange('delivery_cost_bs', parseFloat(e.target.value))}
              placeholder="50.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Costo por llevar el vehículo al arrendatario
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">Zonas de entrega</h4>
            <div className="space-y-2">
              {deliveryZones.map((zone) => (
                <div key={zone} className="flex items-center space-x-2">
                  <Checkbox
                    id={zone}
                    checked={(data.delivery_zones || []).includes(zone)}
                    onCheckedChange={() => toggleDeliveryZone(zone)}
                  />
                  <label
                    htmlFor={zone}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {zone}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <h4 className="font-medium mb-3">Horarios de entrega/recogida</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="pickup_hours">Horario de recogida</Label>
            <Input
              id="pickup_hours"
              value={data.pickup_hours || ''}
              onChange={(e) => onChange('pickup_hours', e.target.value)}
              placeholder="Ej: 8:00 AM - 6:00 PM"
            />
          </div>
          <div>
            <Label htmlFor="return_hours">Horario de devolución</Label>
            <Input
              id="return_hours"
              value={data.return_hours || ''}
              onChange={(e) => onChange('return_hours', e.target.value)}
              placeholder="Ej: 8:00 AM - 6:00 PM"
            />
          </div>
        </div>
      </div>

      {(data.delivery_type === 'pickup' || data.delivery_type === 'both') && (
        <div>
          <Label>Ubicación de recogida</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Haz clic en el mapa para seleccionar la ubicación donde los arrendatarios recogerán el vehículo
          </p>
          <MapLocationPicker
            lat={data.lat}
            lng={data.lng}
            city={data.city || ''}
            onLocationChange={(lat, lng) => {
              onChange('lat', lat);
              onChange('lng', lng);
            }}
          />
        </div>
      )}
    </div>
  );
}