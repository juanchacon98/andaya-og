import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, KeyRound, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SecurityTabProps {
  user: any;
  onUpdate: () => void;
}

export function SecurityTab({ user, onUpdate }: SecurityTabProps) {
  const [sendingVerification, setSendingVerification] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [reason, setReason] = useState("");

  const handleSendVerification = async () => {
    try {
      setSendingVerification(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-send-verification', {
        body: { user_id: user.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Email de verificación enviado");
      onUpdate();
    } catch (error: any) {
      console.error("Error sending verification:", error);
      toast.error("Error al enviar verificación: " + (error.message || "Error desconocido"));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleResetPassword = async () => {
    if (!reason.trim()) {
      toast.error("Debes especificar un motivo");
      return;
    }

    try {
      setResettingPassword(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { 
          user_id: user.id,
          reason: reason.trim()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Email de reset de contraseña enviado");
      setReason("");
      onUpdate();
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error("Error al resetear contraseña: " + (error.message || "Error desconocido"));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!reason.trim()) {
      toast.error("Debes especificar un motivo");
      return;
    }

    try {
      setRevokingSessions(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-revoke-sessions', {
        body: { 
          user_id: user.id,
          reason: reason.trim()
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Todas las sesiones han sido revocadas");
      setReason("");
      onUpdate();
    } catch (error: any) {
      console.error("Error revoking sessions:", error);
      toast.error("Error al revocar sesiones: " + (error.message || "Error desconocido"));
    } finally {
      setRevokingSessions(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user.email_confirmed ? (
              <>
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Email Verificado
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-yellow-500" />
                Email Sin Verificar
              </>
            )}
          </CardTitle>
          <CardDescription>
            {user.email_confirmed 
              ? "El usuario ha verificado su dirección de email."
              : "El usuario aún no ha verificado su email."}
          </CardDescription>
        </CardHeader>
        {!user.email_confirmed && (
          <CardContent>
            <Button 
              onClick={handleSendVerification} 
              disabled={sendingVerification}
              variant="outline"
              className="w-full"
            >
              {sendingVerification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar Verificación de Email
                </>
              )}
            </Button>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resetear Contraseña</CardTitle>
          <CardDescription>
            Envía un email al usuario para que pueda crear una nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <KeyRound className="mr-2 h-4 w-4" />
                Forzar Reset de Contraseña
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Resetear contraseña?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>Se enviará un email al usuario con un link para crear una nueva contraseña.</p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-reason">Motivo *</Label>
                    <Textarea
                      id="reset-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explica por qué se resetea la contraseña..."
                      rows={3}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setReason("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleResetPassword}
                  disabled={resettingPassword || !reason.trim()}
                >
                  {resettingPassword ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Cerrar Todas las Sesiones</CardTitle>
          <CardDescription>
            Fuerza el cierre de sesión en todos los dispositivos del usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Revocar Todas las Sesiones
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Revocar sesiones?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p>El usuario será desconectado de todos sus dispositivos inmediatamente.</p>
                  <div className="space-y-2">
                    <Label htmlFor="revoke-reason">Motivo *</Label>
                    <Textarea
                      id="revoke-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explica por qué se revocan las sesiones..."
                      rows={3}
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setReason("")}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRevokeSessions}
                  disabled={revokingSessions || !reason.trim()}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {revokingSessions ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
