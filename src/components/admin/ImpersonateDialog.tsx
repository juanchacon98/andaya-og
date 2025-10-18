import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserIcon, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function ImpersonateDialog({ open, onOpenChange, userId, userName, userEmail }: ImpersonateDialogProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('15');
  const [submitting, setSubmitting] = useState(false);

  const handleImpersonate = async () => {
    if (!reason.trim()) {
      toast.error('Debes proporcionar un motivo para la impersonación');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('admin-impersonate', {
        body: {
          user_id: userId,
          reason: reason.trim(),
          duration_minutes: parseInt(duration)
        }
      });

      if (error) throw error;

      if (data?.magic_link) {
        // Open magic link in new tab
        window.open(data.magic_link, '_blank');
        
        toast.success(`Sesión de impersonación creada para ${userEmail}`, {
          description: `Expira en ${duration} minutos`
        });
        
        onOpenChange(false);
        setReason('');
        setDuration('15');
      }
    } catch (error: any) {
      console.error('Error impersonating user:', error);
      toast.error('Error al crear sesión de impersonación', {
        description: error.message || 'Intenta nuevamente'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Impersonar Usuario
          </DialogTitle>
          <DialogDescription>
            Iniciar sesión como: <strong>{userName || userEmail}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Advertencia de Seguridad</AlertTitle>
          <AlertDescription className="text-sm">
            Esta acción quedará registrada en el log de auditoría. Todas las acciones realizadas durante la impersonación serán rastreables.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Ejemplo: Soporte técnico - usuario reportó error al publicar vehículo"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Describe el motivo específico de esta impersonación
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duración de la sesión
            </Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos</SelectItem>
                <SelectItem value="10">10 minutos</SelectItem>
                <SelectItem value="15">15 minutos (recomendado)</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">60 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setReason('');
              setDuration('15');
            }}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImpersonate}
            disabled={submitting || !reason.trim()}
          >
            {submitting ? 'Creando sesión...' : 'Impersonar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
