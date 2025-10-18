import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RolesTabProps {
  user: any;
  onUpdate: () => void;
}

const availableRoles = [
  { id: "admin_primary", label: "Admin Principal", color: "destructive" },
  { id: "admin_security", label: "Admin Seguridad", color: "destructive" },
  { id: "owner", label: "Propietario", color: "success" },
  { id: "renter", label: "Arrendatario", color: "secondary" },
];

export function RolesTab({ user, onUpdate }: RolesTabProps) {
  const [saving, setSaving] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || []);
  const [reason, setReason] = useState("");

  const handleToggleRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!reason.trim()) {
        toast.error("Debes especificar un motivo para cambiar roles");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-set-role', {
        body: {
          user_id: user.id,
          roles: selectedRoles,
          reason: reason.trim()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Roles actualizados correctamente");
      setReason("");
      onUpdate();
    } catch (error: any) {
      console.error("Error updating roles:", error);
      toast.error("Error al actualizar roles: " + (error.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Los cambios de roles son críticos y se registran en el audit log. Asegúrate de especificar un motivo claro.
        </AlertDescription>
      </Alert>

      <div>
        <Label className="text-base font-semibold mb-4 block">Roles Actuales</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {user.roles.length > 0 ? (
            user.roles.map((role: string) => {
              const roleInfo = availableRoles.find(r => r.id === role);
              return (
                <Badge key={role} variant={roleInfo?.color as any || "outline"}>
                  {roleInfo?.label || role}
                </Badge>
              );
            })
          ) : (
            <span className="text-sm text-muted-foreground">Sin roles asignados</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-semibold">Seleccionar Nuevos Roles</Label>
        {availableRoles.map((role) => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              id={role.id}
              checked={selectedRoles.includes(role.id)}
              onCheckedChange={() => handleToggleRole(role.id)}
            />
            <Label htmlFor={role.id} className="cursor-pointer flex items-center gap-2">
              {role.label}
              <Badge variant={role.color as any} className="ml-2">
                {role.id}
              </Badge>
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motivo del Cambio *</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explica por qué estás cambiando los roles de este usuario..."
          rows={3}
          className="resize-none"
        />
      </div>

      <Button onClick={handleSave} disabled={saving || !reason.trim()} className="w-full">
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Actualizar Roles
          </>
        )}
      </Button>
    </div>
  );
}
