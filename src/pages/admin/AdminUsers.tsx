import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Car, UserCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface UserWithRole extends Profile {
  roles: string[];
  vehicles_count: number;
  reservations_count: number;
  kyc_status: string | null;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
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
      .eq("user_id", user.id)
      .eq("role", "admin_primary");

    if (!roles || roles.length === 0) {
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!profiles) {
        setLoading(false);
        return;
      }

      const usersWithData = await Promise.all(
        profiles.map(async (profile) => {
          const [rolesRes, vehiclesRes, reservationsRes, kycRes] = await Promise.all([
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", profile.id),
            supabase
              .from("vehicles")
              .select("id", { count: "exact", head: true })
              .eq("owner_id", profile.id),
            supabase
              .from("reservations")
              .select("id", { count: "exact", head: true })
              .eq("renter_id", profile.id),
            supabase
              .from("kyc_verifications")
              .select("status")
              .eq("user_id", profile.id)
              .single()
          ]);

          return {
            ...profile,
            roles: rolesRes.data?.map(r => r.role) || [],
            vehicles_count: vehiclesRes.count || 0,
            reservations_count: reservationsRes.count || 0,
            kyc_status: kycRes.data?.status || null
          };
        })
      );

      setUsers(usersWithData);
      setFilteredUsers(usersWithData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin_primary": return "bg-red-500";
      case "admin_security": return "bg-orange-500";
      case "owner": return "bg-blue-500";
      case "renter": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getKycColor = (status: string | null) => {
    if (!status) return "bg-gray-500";
    switch (status) {
      case "approved": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const owners = filteredUsers.filter(u => u.roles.includes("owner"));
  const renters = filteredUsers.filter(u => u.roles.includes("renter"));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12 bg-gradient-to-b from-background to-secondary/30">
        <div className="container px-4 mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-4xl font-bold mb-2">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra todos los usuarios de la plataforma
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, ID o teléfono..."
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
              <Card>
                <CardHeader>
                  <CardTitle>Todos los Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Roles</TableHead>
                          <TableHead>KYC</TableHead>
                          <TableHead>Vehículos</TableHead>
                          <TableHead>Reservas</TableHead>
                          <TableHead>Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || "Sin nombre"}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <Badge key={role} className={getRoleColor(role)}>
                                      {role}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline">Sin rol</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getKycColor(user.kyc_status)}>
                                {user.kyc_status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.vehicles_count}</TableCell>
                            <TableCell>{user.reservations_count}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="propietarios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Propietarios de Vehículos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>KYC</TableHead>
                          <TableHead>Vehículos</TableHead>
                          <TableHead>Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {owners.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || "Sin nombre"}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getKycColor(user.kyc_status)}>
                                {user.kyc_status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.vehicles_count}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="arrendatarios" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Arrendatarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>KYC</TableHead>
                          <TableHead>Reservas</TableHead>
                          <TableHead>Registro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {renters.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.full_name || "Sin nombre"}
                            </TableCell>
                            <TableCell>{user.phone || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getKycColor(user.kyc_status)}>
                                {user.kyc_status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>{user.reservations_count}</TableCell>
                            <TableCell>
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminUsers;
