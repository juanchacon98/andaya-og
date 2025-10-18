import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: number;
  type: string;
  status: string;
  price_per_day: number;
  city: string;
  plate?: string;
  description?: string;
}

interface VehicleEditDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VehicleEditDialog({ vehicle, open, onOpenChange, onSuccess }: VehicleEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehicle>>(vehicle || {});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          type: formData.type as "sedan" | "suv" | "van" | "pickup" | "coupe" | "hatchback" | "moto" | "otro",
          price_per_day: formData.price_per_day,
          city: formData.city,
          plate: formData.plate,
          description: formData.description,
        })
        .eq("id", vehicle.id);

      if (error) throw error;

      toast.success("Vehículo actualizado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      toast.error("Error al actualizar vehículo: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Vehículo</DialogTitle>
          <DialogDescription>
            Modifica la información del vehículo {vehicle.brand} {vehicle.model}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                value={formData.plate || ""}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                placeholder="ABC123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand || ""}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model || ""}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                min="1980"
                max={new Date().getFullYear() + 1}
                value={formData.year || ""}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type || ""}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedan">Sedán</SelectItem>
                  <SelectItem value="suv">SUV</SelectItem>
                  <SelectItem value="hatchback">Hatchback</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="coupe">Coupé</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio por día (Bs.)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price_per_day || ""}
                onChange={(e) => setFormData({ ...formData, price_per_day: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Select
                value={formData.city || ""}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
              >
                <SelectTrigger id="city">
                  <SelectValue placeholder="Selecciona ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Caracas">Caracas</SelectItem>
                  <SelectItem value="Valencia">Valencia</SelectItem>
                  <SelectItem value="Maracaibo">Maracaibo</SelectItem>
                  <SelectItem value="Maracay">Maracay</SelectItem>
                  <SelectItem value="Barquisimeto">Barquisimeto</SelectItem>
                  <SelectItem value="Lechería">Lechería</SelectItem>
                  <SelectItem value="Porlamar">Porlamar</SelectItem>
                  <SelectItem value="Mérida">Mérida</SelectItem>
                  <SelectItem value="Puerto La Cruz">Puerto La Cruz</SelectItem>
                  <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada del vehículo, políticas, condiciones..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
