import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VehiclePricingProps {
  data: any;
  onChange: (field: string, value: any) => void;
}

export function VehiclePricing({ data, onChange }: VehiclePricingProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_bs">Precio por día (Bs) *</Label>
          <Input
            id="price_bs"
            type="number"
            step="0.01"
            value={data.price_bs || ''}
            onChange={(e) => onChange('price_bs', parseFloat(e.target.value))}
            placeholder="150.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Precio base por día de alquiler
          </p>
        </div>

        <div>
          <Label htmlFor="currency">Moneda</Label>
          <Select value={data.currency || 'VES'} onValueChange={(v) => onChange('currency', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VES">Bolívares (Bs)</SelectItem>
              <SelectItem value="USD">Dólares (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deposit_bs">Depósito de seguridad (Bs)</Label>
          <Input
            id="deposit_bs"
            type="number"
            step="0.01"
            value={data.deposit_bs || ''}
            onChange={(e) => onChange('deposit_bs', parseFloat(e.target.value))}
            placeholder="500.00"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Monto reembolsable en caso de daños
          </p>
        </div>

        <div>
          <Label htmlFor="cleaning_fee_bs">Tarifa de limpieza (Bs)</Label>
          <Input
            id="cleaning_fee_bs"
            type="number"
            step="0.01"
            value={data.cleaning_fee_bs || ''}
            onChange={(e) => onChange('cleaning_fee_bs', parseFloat(e.target.value))}
            placeholder="50.00"
          />
        </div>

        <div>
          <Label htmlFor="km_included">Kilómetros incluidos por día</Label>
          <Input
            id="km_included"
            type="number"
            value={data.km_included || 200}
            onChange={(e) => onChange('km_included', parseInt(e.target.value))}
          />
        </div>

        <div>
          <Label htmlFor="extra_km_fee_bs">Costo por km adicional (Bs)</Label>
          <Input
            id="extra_km_fee_bs"
            type="number"
            step="0.01"
            value={data.extra_km_fee_bs || ''}
            onChange={(e) => onChange('extra_km_fee_bs', parseFloat(e.target.value))}
            placeholder="2.00"
          />
        </div>

        <div>
          <Label htmlFor="min_rental_days">Días mínimos de alquiler</Label>
          <Select 
            value={data.min_rental_days?.toString() || '1'} 
            onValueChange={(v) => onChange('min_rental_days', parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 día</SelectItem>
              <SelectItem value="2">2 días</SelectItem>
              <SelectItem value="3">3 días</SelectItem>
              <SelectItem value="7">7 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cancellation_policy">Política de cancelación</Label>
          <Select 
            value={data.cancellation_policy || 'flexible'} 
            onValueChange={(v) => onChange('cancellation_policy', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flexible">Flexible (24h antes)</SelectItem>
              <SelectItem value="moderate">Moderada (48h antes)</SelectItem>
              <SelectItem value="strict">Estricta (7 días antes)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Resumen de precios</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Precio por día:</span>
            <span className="font-medium">Bs {data.price_bs || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Depósito de seguridad:</span>
            <span className="font-medium">Bs {data.deposit_bs || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Tarifa de limpieza:</span>
            <span className="font-medium">Bs {data.cleaning_fee_bs || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}