import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, User, Shield, FileCheck, Lock, Activity, StickyNote } from "lucide-react";
import { ProfileTab } from "./user-edit-tabs/ProfileTab";
import { RolesTab } from "./user-edit-tabs/RolesTab";
import { KYCTab } from "./user-edit-tabs/KYCTab";
import { SecurityTab } from "./user-edit-tabs/SecurityTab";
import { ActivityTab } from "./user-edit-tabs/ActivityTab";
import { NotesTab } from "./user-edit-tabs/NotesTab";

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onUpdate?: () => void;
}

interface UserDetails {
  id: string;
  email: string;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  kyc_status: string | null;
  is_active: boolean;
}

export function UserEditDialog({ open, onOpenChange, userId, onUpdate }: UserEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [activeTab, setActiveTab] = useState("perfil");

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  const fetchUserDetails = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // Obtener datos del perfil
      const { data: profile } = await supabase
        .from("v_profiles_basic" as any)
        .select("id, full_name, phone, kyc_status")
        .eq("id", userId)
        .maybeSingle();

      // Obtener roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      // Obtener KYC status
      const { data: kyc } = await supabase
        .from("kyc_verifications")
        .select("status")
        .eq("user_id", userId)
        .single();

      // Obtener datos de auth mediante edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-list-users', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      const authUser = response.data?.users?.find((u: any) => u.id === userId);

      setUser({
        id: userId,
        email: authUser?.email || "",
        email_confirmed: authUser?.email_confirmed || false,
        created_at: (profile as any)?.created_at || "",
        last_sign_in_at: authUser?.last_sign_in_at || null,
        full_name: (profile as any)?.full_name || null,
        phone: (profile as any)?.phone || null,
        roles: userRoles?.map(r => r.role) || [],
        kyc_status: (kyc as any)?.status || null,
        is_active: (profile as any)?.is_active ?? true,
      });
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      toast.error("Error al cargar datos del usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchUserDetails();
      if (onUpdate) {
        onUpdate();
      }
      toast.success("Cambios guardados correctamente");
    } catch (error) {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setActiveTab("perfil");
    onOpenChange(false);
  };

  if (!user && loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getKycBadgeVariant = (status: string | null) => {
    if (!status) return "outline";
    switch (status) {
      case "verified": return "success";
      case "pending": return "warning";
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  const getKycLabel = (status: string | null) => {
    if (!status) return "Sin KYC";
    const labels: Record<string, string> = {
      verified: "Verificado",
      pending: "Pendiente",
      rejected: "Rechazado"
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-xl">{user.full_name || "Usuario sin nombre"}</DialogTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={user.is_active ? "success" : "destructive"}>
                  {user.is_active ? "Activo" : "Suspendido"}
                </Badge>
                <Badge variant={getKycBadgeVariant(user.kyc_status)}>
                  KYC: {getKycLabel(user.kyc_status)}
                </Badge>
                {!user.email_confirmed && (
                  <Badge variant="warning">Email sin confirmar</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Roles</span>
            </TabsTrigger>
            <TabsTrigger value="kyc" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">KYC</span>
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Seguridad</span>
            </TabsTrigger>
            <TabsTrigger value="actividad" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Actividad</span>
            </TabsTrigger>
            <TabsTrigger value="notas" className="flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              <span className="hidden sm:inline">Notas</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="perfil" className="m-0">
              <ProfileTab user={user} onUpdate={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="roles" className="m-0">
              <RolesTab user={user} onUpdate={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="kyc" className="m-0">
              <KYCTab user={user} onUpdate={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="seguridad" className="m-0">
              <SecurityTab user={user} onUpdate={fetchUserDetails} />
            </TabsContent>

            <TabsContent value="actividad" className="m-0">
              <ActivityTab userId={user.id} />
            </TabsContent>

            <TabsContent value="notas" className="m-0">
              <NotesTab userId={user.id} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
