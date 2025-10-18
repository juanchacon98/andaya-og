import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  phone: z.string().optional(),
});

interface ProfileTabProps {
  user: any;
  onUpdate: () => void;
}

const ciudadesVE = [
  "Caracas", "Valencia", "Maracaibo", "Maracay", "Barquisimeto",
  "Lechería", "Porlamar", "Mérida", "Puerto La Cruz", "San Cristóbal"
];

export function ProfileTab({ user, onUpdate }: ProfileTabProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validar
      profileSchema.parse(formData);

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-update-profile', {
        body: {
          user_id: user.id,
          profilePatch: {
            full_name: formData.full_name,
            phone: formData.phone || null,
          }
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Perfil actualizado correctamente");
      onUpdate();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error updating profile:", error);
        toast.error("Error al actualizar perfil: " + (error.message || "Error desconocido"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="full_name">Nombre Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Juan Pérez"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+58 412 1234567"
          />
        </div>

        <div className="grid gap-2">
          <Label>Email (solo lectura)</Label>
          <Input value={user.email} disabled />
        </div>

        <div className="grid gap-2">
          <Label>ID de Usuario (solo lectura)</Label>
          <Input value={user.id} disabled className="font-mono text-xs" />
        </div>

        <div className="grid gap-2">
          <Label>Fecha de Registro</Label>
          <Input 
            value={new Date(user.created_at).toLocaleString('es-VE')} 
            disabled 
          />
        </div>

        {user.last_sign_in_at && (
          <div className="grid gap-2">
            <Label>Último Acceso</Label>
            <Input 
              value={new Date(user.last_sign_in_at).toLocaleString('es-VE')} 
              disabled 
            />
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Guardar Perfil
          </>
        )}
      </Button>
    </div>
  );
}
