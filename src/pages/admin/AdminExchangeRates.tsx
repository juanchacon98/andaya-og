import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, DollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { formatBs, formatUsd, formatEur } from "@/lib/currency";

interface FxSettings {
  default_provider: string;
  default_currency: string;
  refresh_minutes: number;
  eur_usd_fallback_rate: number;
}

const AdminExchangeRates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [settings, setSettings] = useState<FxSettings>({
    default_provider: 'bcv',
    default_currency: 'USD',
    refresh_minutes: 30,
    eur_usd_fallback_rate: 1.10
  });

  const bcvUsd = useExchangeRate({ provider: 'bcv', code: 'USD' });
  const bcvEur = useExchangeRate({ provider: 'bcv', code: 'EUR' });
  const paraleloUsd = useExchangeRate({ provider: 'paralelo', code: 'USD' });

  useEffect(() => {
    checkAdminAccess();
    fetchSettings();
  }, []);

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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("fx_settings")
        .select("*")
        .single();

      if (error) throw error;
      
      if (data) {
        setSettings({
          default_provider: data.default_provider,
          default_currency: data.default_currency,
          refresh_minutes: data.refresh_minutes,
          eur_usd_fallback_rate: parseFloat(String(data.eur_usd_fallback_rate))
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshRates = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fx-refresh');

      if (error) throw error;

      toast({
        title: "Tasas actualizadas",
        description: `Se insertaron ${data.inserted} nuevas tasas`,
      });

      // Refrescar los hooks
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error refreshing rates:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar las tasas",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { error } = await supabase
        .from("fx_settings")
        .update({
          default_provider: settings.default_provider,
          default_currency: settings.default_currency,
          refresh_minutes: settings.refresh_minutes,
          eur_usd_fallback_rate: settings.eur_usd_fallback_rate
        })
        .eq('id', await getSettingsId());

      if (error) throw error;

      toast({
        title: "Configuración guardada",
        description: "Los cambios se han aplicado correctamente",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  };

  const getSettingsId = async () => {
    const { data } = await supabase.from("fx_settings").select("id").single();
    return data?.id;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasas de Cambio</h1>
          <p className="text-muted-foreground mt-1">
            Configuración de conversión USD/EUR ↔︎ Bs
          </p>
        </div>

        {/* Current Rates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">BCV - USD</CardTitle>
                {bcvUsd.stale && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Desactualizada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {bcvUsd.loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : bcvUsd.rate ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{formatBs(bcvUsd.rate.value)}</p>
                  <p className="text-sm text-muted-foreground">por 1 USD</p>
                  <p className="text-xs text-muted-foreground">
                    Actualizado hace {bcvUsd.hoursSinceUpdate.toFixed(1)}h
                  </p>
                </div>
              ) : (
                <p className="text-destructive">No disponible</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">BCV - EUR</CardTitle>
                {bcvEur.stale && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Desactualizada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {bcvEur.loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : bcvEur.rate ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{formatBs(bcvEur.rate.value)}</p>
                  <p className="text-sm text-muted-foreground">por 1 EUR</p>
                  {bcvEur.rate.source?.derived && (
                    <Badge variant="outline" className="text-xs">Derivado</Badge>
                  )}
                </div>
              ) : (
                <p className="text-destructive">No disponible</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Paralelo - USD</CardTitle>
                {paraleloUsd.stale && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Desactualizada
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {paraleloUsd.loading ? (
                <p className="text-muted-foreground">Cargando...</p>
              ) : paraleloUsd.rate ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold">{formatBs(paraleloUsd.rate.value)}</p>
                  <p className="text-sm text-muted-foreground">por 1 USD</p>
                  <p className="text-xs text-muted-foreground">
                    Actualizado hace {paraleloUsd.hoursSinceUpdate.toFixed(1)}h
                  </p>
                </div>
              ) : (
                <p className="text-destructive">No disponible</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Actualizar Tasas
            </CardTitle>
            <CardDescription>
              Obtener las tasas más recientes desde ve.dolarapi.com
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRefreshRates} 
              disabled={refreshing}
              className="w-full sm:w-auto"
            >
              {refreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Ahora
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Ajustes de tasas de cambio y preferencias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Proveedor por Defecto</Label>
                <Select 
                  value={settings.default_provider}
                  onValueChange={(value) => setSettings({...settings, default_provider: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bcv">BCV</SelectItem>
                    <SelectItem value="paralelo">Paralelo</SelectItem>
                    <SelectItem value="monitor">Monitor Dólar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moneda por Defecto</Label>
                <Select 
                  value={settings.default_currency}
                  onValueChange={(value) => setSettings({...settings, default_currency: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Intervalo de Refresco (minutos)</Label>
                <Input
                  type="number"
                  min="5"
                  max="120"
                  value={settings.refresh_minutes}
                  onChange={(e) => setSettings({...settings, refresh_minutes: parseInt(e.target.value)})}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Tasa EUR/USD Fallback
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="2"
                  value={settings.eur_usd_fallback_rate}
                  onChange={(e) => setSettings({...settings, eur_usd_fallback_rate: parseFloat(e.target.value)})}
                />
                <p className="text-xs text-muted-foreground">
                  Usado para calcular EUR cuando no está disponible
                </p>
              </div>
            </div>

            <Button onClick={handleSaveSettings} className="w-full sm:w-auto">
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Example Conversions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Ejemplo de Conversiones</CardTitle>
            <CardDescription>
              Cómo se verán los montos en la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Monto en Bolívares:</p>
                <p className="text-2xl font-bold mb-2">{formatBs(1000000)}</p>
                {bcvUsd.rate && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {formatUsd(1000000 / bcvUsd.rate.value)} (BCV)
                  </p>
                )}
                {bcvEur.rate && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {formatEur(1000000 / bcvEur.rate.value)} (BCV)
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminExchangeRates;