import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  User,
  DollarSign,
  TrendingUp,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Reservation {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total: number;
  daily_price: number;
  created_at: string;
  renter_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface VehicleStats {
  totalReservations: number;
  totalDays: number;
  totalRevenue: number;
  pendingRevenue: number;
  completedRevenue: number;
}

interface VehicleStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleTitle: string;
  pricePerDay: number;
}

export const VehicleStatsDialog = ({
  open,
  onOpenChange,
  vehicleId,
  vehicleTitle,
  pricePerDay,
}: VehicleStatsDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<VehicleStats>({
    totalReservations: 0,
    totalDays: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    completedRevenue: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  useEffect(() => {
    if (open && vehicleId) {
      fetchReservationsAndStats();
    }
  }, [open, vehicleId]);

  useEffect(() => {
    applyFilters();
  }, [reservations, statusFilter, dateRange]);

  const fetchReservationsAndStats = async () => {
    try {
      setLoading(true);

      // Fetch reservations
      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select("id, start_date, end_date, status, total, daily_price, created_at, renter_id")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });

      if (reservationsError) throw reservationsError;

      // Fetch profiles separately
      const reservationsWithProfiles = await Promise.all(
        (reservationsData || []).map(async (reservation) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", reservation.renter_id)
            .single();

          return {
            ...reservation,
            profiles: profile || undefined,
          };
        })
      );

      setReservations(reservationsWithProfiles);

      // Calculate stats
      const totalReservations = reservationsWithProfiles.length;
      const totalDays = reservationsWithProfiles.reduce((sum, r) => {
        const days = differenceInDays(new Date(r.end_date), new Date(r.start_date));
        return sum + days;
      }, 0);

      const totalRevenue = reservationsWithProfiles.reduce(
        (sum, r) => sum + Number(r.total),
        0
      );

      const completedRevenue = reservationsWithProfiles
        .filter((r) => r.status === "finished")
        .reduce((sum, r) => sum + Number(r.total), 0);

      const pendingRevenue = reservationsWithProfiles
        .filter((r) => r.status === "approved" || r.status === "pending")
        .reduce((sum, r) => sum + Number(r.total), 0);

      setStats({
        totalReservations,
        totalDays,
        totalRevenue,
        pendingRevenue,
        completedRevenue,
      });
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reservations];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRange) {
        case "30d":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "90d":
          cutoffDate.setDate(now.getDate() - 90);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        (r) => new Date(r.created_at) >= cutoffDate
      );
    }

    setFilteredReservations(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
    > = {
      pending: {
        label: "Pendiente",
        variant: "secondary",
        icon: Clock,
      },
      approved: {
        label: "Aprobada",
        variant: "default",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelada",
        variant: "destructive",
        icon: XCircle,
      },
      finished: {
        label: "Finalizada",
        variant: "outline",
        icon: CheckCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "outline" as const,
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Fecha no válida";
      return format(date, "dd/MM/yyyy", { locale: es });
    } catch {
      return "Fecha no válida";
    }
  };

  const handleContactRenter = (phone: string, renterName: string) => {
    if (!phone) {
      toast.error("No se encontró información de contacto");
      return;
    }

    const phoneNumber = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${renterName}, te contacto respecto a tu reserva del vehículo ${vehicleTitle}.`
    );

    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  const handleExportCSV = () => {
    const csvData = filteredReservations.map((r) => ({
      Cliente: r.profiles?.full_name || "N/A",
      Inicio: formatDate(r.start_date),
      Fin: formatDate(r.end_date),
      Días: differenceInDays(new Date(r.end_date), new Date(r.start_date)),
      Estado: r.status,
      Monto: `Bs ${r.total.toLocaleString()}`,
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas-${vehicleTitle.replace(/\s+/g, "-")}-${format(
      new Date(),
      "yyyy-MM-dd"
    )}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Estadísticas e Ingresos</DialogTitle>
          <DialogDescription>{vehicleTitle}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cargando estadísticas...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Reservas Totales</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalReservations}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Días Reservados</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalDays}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                  </div>
                  <p className="text-2xl font-bold">
                    Bs {stats.totalRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Pendiente</p>
                  </div>
                  <p className="text-2xl font-bold">
                    Bs {stats.pendingRevenue.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tiempos</SelectItem>
                    <SelectItem value="30d">Últimos 30 días</SelectItem>
                    <SelectItem value="90d">Últimos 90 días</SelectItem>
                    <SelectItem value="year">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="approved">Aprobada</SelectItem>
                    <SelectItem value="finished">Finalizada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={filteredReservations.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Table */}
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Inicio</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">
                          No hay reservas con los filtros seleccionados
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReservations.map((reservation) => {
                      const days = differenceInDays(
                        new Date(reservation.end_date),
                        new Date(reservation.start_date)
                      );

                      return (
                        <TableRow key={reservation.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">
                                {reservation.profiles?.full_name || "Cliente"}
                              </p>
                              {reservation.profiles?.phone ? (
                                <a
                                  href={`https://wa.me/${reservation.profiles.phone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  {reservation.profiles.phone}
                                </a>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Sin contacto disponible
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(reservation.start_date)}</TableCell>
                          <TableCell>{formatDate(reservation.end_date)}</TableCell>
                          <TableCell>{days} día{days !== 1 ? "s" : ""}</TableCell>
                          <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                          <TableCell className="text-right font-semibold">
                            Bs {reservation.total.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {reservation.profiles?.phone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleContactRenter(
                                    reservation.profiles!.phone,
                                    reservation.profiles!.full_name
                                  )
                                }
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};