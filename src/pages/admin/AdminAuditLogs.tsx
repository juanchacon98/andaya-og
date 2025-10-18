import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Shield, Search, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AuditLog {
  id: number;
  action: string;
  actor_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  created_at: string;
}

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, actionFilter, entityFilter, searchTerm]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los logs de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (entityFilter !== "all") {
      filtered = filtered.filter(log => log.entity_type === entityFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", className?: string }> = {
      create: { variant: "default", className: "bg-green-600" },
      update: { variant: "default", className: "bg-blue-600" },
      delete: { variant: "destructive" },
      approve: { variant: "default", className: "bg-green-600" },
      reject: { variant: "destructive" },
      login: { variant: "secondary" },
      logout: { variant: "secondary" },
    };
    const config = variants[action.toLowerCase()] || { variant: "secondary" as const };
    return <Badge variant={config.variant} className={config.className}>{action}</Badge>;
  };

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  const uniqueEntities = Array.from(new Set(logs.map(log => log.entity_type).filter(Boolean))) as string[];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs de Auditoría</h1>
            <p className="text-muted-foreground mt-1">
              Monitoreo completo de actividades del sistema
            </p>
          </div>
          <Button onClick={fetchLogs} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filtrados</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipos de Acción</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueActions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entidades</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEntities.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtra los logs por acción, entidad o búsqueda</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Acción</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las acciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las acciones</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Entidad</label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las entidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las entidades</SelectItem>
                    {uniqueEntities.map(entity => (
                      <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Búsqueda</label>
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Actividades</CardTitle>
            <CardDescription>
              Últimos {filteredLogs.length} eventos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron logs que coincidan con los filtros
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>ID Entidad</TableHead>
                    <TableHead>Actor ID</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.entity_type || "-"}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">
                        {log.entity_id || "-"}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[150px] truncate">
                        {log.actor_id || "Sistema"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Log de Auditoría</DialogTitle>
            <DialogDescription>
              Información completa del evento registrado
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID</label>
                  <p className="text-sm font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha/Hora</label>
                  <p className="text-sm">{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Acción</label>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Entidad</label>
                  <p className="text-sm">{selectedLog.entity_type || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID de Entidad</label>
                  <p className="text-sm font-mono break-all">{selectedLog.entity_id || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Actor ID</label>
                  <p className="text-sm font-mono break-all">{selectedLog.actor_id || "Sistema"}</p>
                </div>
              </div>
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminAuditLogs;
