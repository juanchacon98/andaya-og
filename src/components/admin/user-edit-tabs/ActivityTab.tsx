import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, User, Shield, FileCheck, Car } from "lucide-react";
import { toast } from "sonner";

interface ActivityTabProps {
  userId: string;
}

export function ActivityTab({ userId }: ActivityTabProps) {
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .or(`actor_id.eq.${userId},entity_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error: any) {
      console.error("Error fetching activities:", error);
      toast.error("Error al cargar actividades");
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes("role")) return <Shield className="h-4 w-4" />;
    if (action.includes("kyc")) return <FileCheck className="h-4 w-4" />;
    if (action.includes("vehicle")) return <Car className="h-4 w-4" />;
    return <User className="h-4 w-4" />;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      update_user_roles: "Actualización de roles",
      update_user_profile: "Actualización de perfil",
      update_kyc_status: "Cambio de estado KYC",
      send_verification_email: "Envío de verificación",
      force_password_reset: "Reset de contraseña",
      revoke_all_sessions: "Revocación de sesiones",
      vehicle_created: "Vehículo creado",
      vehicle_updated: "Vehículo actualizado",
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes("role") || action.includes("security")) return "destructive";
    if (action.includes("kyc")) return "warning";
    if (action.includes("vehicle")) return "success";
    return "secondary";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Actividad</CardTitle>
          <CardDescription>
            No hay registro de actividades para este usuario.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Actividad</CardTitle>
          <CardDescription>
            Últimas {activities.length} actividades del usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div 
                key={activity.id}
                className="flex gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{getActionLabel(activity.action)}</p>
                      {activity.entity_type && (
                        <p className="text-sm text-muted-foreground">
                          Tipo: {activity.entity_type}
                        </p>
                      )}
                    </div>
                    <Badge variant={getActionColor(activity.action) as any}>
                      {activity.action}
                    </Badge>
                  </div>
                  
                  {activity.metadata && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      <pre className="whitespace-pre-wrap break-words">
                        {JSON.stringify(activity.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(activity.created_at).toLocaleString('es-VE')}
                    </span>
                    {activity.actor_id && activity.actor_id !== userId && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Realizado por: {activity.actor_id.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
