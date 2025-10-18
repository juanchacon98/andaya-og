import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface QuickEditVehicleProps {
  vehicle: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function QuickEditVehicle({ vehicle, open, onOpenChange, onSuccess }: QuickEditVehicleProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    kilometraje: vehicle.kilometraje || 0,
    price_bs: vehicle.price_bs || 0,
    status: vehicle.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({
          kilometraje: formData.kilometraje,
          price_bs: formData.price_bs,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', vehicle.id);

      if (error) throw error;

      toast.success('Vehículo actualizado exitosamente');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edición rápida</DialogTitle>
          <DialogDescription>
            Actualiza información frecuente de {vehicle.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kilometraje">Kilometraje actual</Label>
            <Input
              id="kilometraje"
              type="number"
              value={formData.kilometraje}
              onChange={(e) => setFormData({ ...formData, kilometraje: parseInt(e.target.value) })}
              placeholder="50000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Actualiza el kilometraje actual del vehículo
            </p>
          </div>

          <div>
            <Label htmlFor="price_bs">Precio por día (Bs)</Label>
            <Input
              id="price_bs"
              type="number"
              step="0.01"
              value={formData.price_bs}
              onChange={(e) => setFormData({ ...formData, price_bs: parseFloat(e.target.value) })}
              placeholder="150.00"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Modifica el precio de alquiler diario
            </p>
          </div>

          <div>
            <Label htmlFor="status">Estado del vehículo</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo (visible para alquilar)</SelectItem>
                <SelectItem value="paused">Pausado (no visible)</SelectItem>
                <SelectItem value="maintenance">En mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Cambia la disponibilidad del vehículo
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}