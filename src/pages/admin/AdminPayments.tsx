import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, DollarSign } from "lucide-react";

interface Payment {
  id: string;
  amount_total: number;
  upfront: number;
  installments: number;
  status: string;
  method: string;
  created_at: string;
  reservation: {
    vehicle: {
      brand: string;
      model: string;
    };
    renter: {
      full_name: string;
    };
  };
}

const AdminPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    checkAdminAccess();
    fetchPayments();
  }, []);

  useEffect(() => {
    const filtered = payments.filter(p =>
      p.reservation?.renter?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.reservation?.vehicle?.brand.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [search, payments]);

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
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          reservation:reservations!payments_reservation_id_fkey (
            vehicle:vehicles!reservations_vehicle_id_fkey (brand, model),
            renter:profiles!reservations_renter_id_fkey (full_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const paymentsData = (data as any) || [];
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
      
      const total = paymentsData.reduce((sum, p) => sum + Number(p.amount_total), 0);
      setTotalRevenue(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "pending": return "warning";
      case "failed": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: "Completado",
      pending: "Pendiente",
      failed: "Fallido"
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando pagos...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Pagos</h1>
          <p className="text-muted-foreground mt-1">
            Monitorea todos los pagos y transacciones
          </p>
        </div>

        <Card className="border-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500 text-white">
                <DollarSign className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Ingresos Totales</p>
                <p className="text-3xl font-bold text-foreground">
                  ${(totalRevenue / 1000000).toFixed(2)}M COP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario o vehículo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Pagos ({filteredPayments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Inicial</TableHead>
                    <TableHead>Cuotas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.reservation?.vehicle?.brand} {payment.reservation?.vehicle?.model}
                      </TableCell>
                      <TableCell>{payment.reservation?.renter?.full_name || "N/A"}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                      <TableCell className="font-semibold">
                        ${payment.amount_total.toLocaleString()}
                      </TableCell>
                      <TableCell>${payment.upfront?.toLocaleString() || 0}</TableCell>
                      <TableCell>{payment.installments || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(payment.status) as any}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
