import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Car, UserCheck, RefreshCw, Edit, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserEditDialog } from "@/components/admin/UserEditDialog";
import { ImpersonateDialog } from "@/components/admin/ImpersonateDialog";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  phone: string | null;
  roles: string[];
  kyc_status: string | null;
  email_confirmed: boolean;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [impersonateUser, setImpersonateUser] = useState<{id: string, name: string | null, email: string} | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasAdminRole = roles?.some(r => 
      r.role === "admin_primary" || r.role === "admin_security"
    );

    if (!hasAdminRole) {
      navigate("/");
      return;
    }

    fetchAllUsers();
  };

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("No hay sesión activa");
        return;
      }

      const response = await supabase.functions.invoke('admin-list-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log("Response from admin-list-users:", response);

      if (response.error) {
        throw response.error;
      }

      if (response.data?.users) {
        console.log("Total users received:", response.data.users.length);
        console.log("Users data:", response.data.users);
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
        toast.success(`${response.data.users.length} usuarios cargados correctamente`);
      } else {
        console.log("No users data in response:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin_primary: "Admin Principal",
      admin_security: "Admin Seguridad",
      owner: "Propietario",
      renter: "Arrendatario"
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin_primary": return "destructive";
      case "admin_security": return "destructive";
      case "owner": return "success";
      case "renter": return "secondary";
      default: return "outline";
    }
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
    if (!status) return "N/A";
    const labels: Record<string, string> = {
      verified: "Verificado",
      pending: "Pendiente",
      rejected: "Rechazado"
    };
    return labels[status] || status;
  };

  const owners = filteredUsers.filter(u => u.roles.includes("owner"));
  const renters = filteredUsers.filter(u => u.roles.includes("renter"));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando todos los usuarios...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">
              Administra todos los usuarios registrados en Supabase
            </p>
          </div>
          <Button onClick={fetchAllUsers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, ID o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="todos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="todos">Todos ({filteredUsers.length})</TabsTrigger>
            <TabsTrigger value="propietarios">
              <Car className="mr-2 h-4 w-4" />
              Propietarios ({owners.length})
            </TabsTrigger>
            <TabsTrigger value="arrendatarios">
              <UserCheck className="mr-2 h-4 w-4" />
              Arrendatarios ({renters.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Todos los Usuarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Email Confirmado</TableHead>
                        <TableHead>Último acceso</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No se encontraron usuarios
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              {user.full_name || <span className="text-muted-foreground italic">Sin perfil</span>}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <Badge key={role} variant={getRoleColor(role)}>
                                      {getRoleLabel(role)}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline">Sin rol</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getKycBadgeVariant(user.kyc_status)}>
                                {getKycLabel(user.kyc_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.email_confirmed ? (
                                <Badge variant="default">Sí</Badge>
                              ) : (
                                <Badge variant="outline">No</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.last_sign_in_at 
                                ? new Date(user.last_sign_in_at).toLocaleString('es-VE')
                                : "Nunca"
                              }
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setImpersonateUser({
                                      id: user.id,
                                      name: user.full_name,
                                      email: user.email
                                    });
                                    setImpersonateDialogOpen(true);
                                  }}
                                  title="Impersonar usuario"
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setEditDialogOpen(true);
                                  }}
                                  title="Editar usuario"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="propietarios" className="mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Propietarios de Vehículos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {owners.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No hay propietarios registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        owners.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              {user.full_name || <span className="text-muted-foreground italic">Sin perfil</span>}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={getKycBadgeVariant(user.kyc_status)}>
                                {getKycLabel(user.kyc_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-VE')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="arrendatarios" className="mt-6">
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Arrendatarios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Registro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No hay arrendatarios registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        renters.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.email}
                            </TableCell>
                            <TableCell>
                              {user.full_name || <span className="text-muted-foreground italic">Sin perfil</span>}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={getKycBadgeVariant(user.kyc_status)}>
                                {getKycLabel(user.kyc_status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString('es-VE')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <UserEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={selectedUserId}
          onUpdate={fetchAllUsers}
        />
        
        {impersonateUser && (
          <ImpersonateDialog
            open={impersonateDialogOpen}
            onOpenChange={setImpersonateDialogOpen}
            userId={impersonateUser.id}
            userName={impersonateUser.name}
            userEmail={impersonateUser.email}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
