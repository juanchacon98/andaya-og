import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface VehicleBasicInfoProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function VehicleBasicInfo({ data, onChange }: VehicleBasicInfoProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="brand">Marca *</Label>
          <Input
            id="brand"
            value={data.brand || ''}
            onChange={(e) => onChange('brand', e.target.value)}
            placeholder="Toyota, Ford, Chevrolet..."
          />
        </div>

        <div>
          <Label htmlFor="model">Modelo *</Label>
          <Input
            id="model"
            value={data.model || ''}
            onChange={(e) => onChange('model', e.target.value)}
            placeholder="Corolla, Mustang, Spark..."
          />
        </div>

        <div>
          <Label htmlFor="year">Año *</Label>
          <Select value={data.year?.toString() || ''} onValueChange={(v) => onChange('year', parseInt(v))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="type">Tipo de vehículo *</Label>
          <Select value={data.type || ''} onValueChange={(v) => onChange('type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compacto</SelectItem>
              <SelectItem value="sedan">Sedán</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="truck">Camioneta</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="luxury">Lujo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="transmission">Transmisión</Label>
          <Select value={data.transmission || ''} onValueChange={(v) => onChange('transmission', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="automatic">Automática</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fuel_type">Combustible</Label>
          <Select value={data.fuel_type || ''} onValueChange={(v) => onChange('fuel_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gasoline">Gasolina</SelectItem>
              <SelectItem value="diesel">Diésel</SelectItem>
              <SelectItem value="electric">Eléctrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={data.color || ''}
            onChange={(e) => onChange('color', e.target.value)}
            placeholder="Blanco, Negro, Azul..."
          />
        </div>

        <div>
          <Label htmlFor="plate">Placa</Label>
          <Input
            id="plate"
            value={data.plate || ''}
            onChange={(e) => onChange('plate', e.target.value.toUpperCase())}
            placeholder="AAA-000"
          />
        </div>

        <div>
          <Label htmlFor="vin">VIN (opcional)</Label>
          <Input
            id="vin"
            value={data.vin || ''}
            onChange={(e) => onChange('vin', e.target.value)}
            placeholder="Número de identificación del vehículo"
          />
        </div>

        <div>
          <Label htmlFor="kilometraje">Kilometraje</Label>
          <Input
            id="kilometraje"
            type="number"
            value={data.kilometraje || ''}
            onChange={(e) => onChange('kilometraje', parseInt(e.target.value))}
            placeholder="50000"
          />
        </div>

        <div>
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => onChange('city', e.target.value)}
            placeholder="Caracas, Maracaibo, Valencia..."
          />
        </div>

        <div>
          <Label htmlFor="title">Título del anuncio *</Label>
          <Input
            id="title"
            value={data.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Ej: Toyota Corolla 2020 - Excelente estado"
            className="md:col-span-2"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Describe las características y condiciones de tu vehículo..."
          rows={4}
        />
      </div>
    </div>
  );
}