import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileCheck, FileX, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface KYCTabProps {
  user: any;
  onUpdate: () => void;
}

export function KYCTab({ user, onUpdate }: KYCTabProps) {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [kycData, setKycData] = useState<any>(null);
  const [newStatus, setNewStatus] = useState(user.kyc_status || "pending");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchKYCData();
  }, [user.id]);

  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      // If we have data with file paths, generate signed URLs
      if (data) {
        const signedUrls: any = {};
        
        if (data.id_front_url) {
          const { data: signedData } = await supabase.storage
            .from('kyc_documents')
            .createSignedUrl(data.id_front_url, 3600); // 1 hour expiry
          signedUrls.id_front_url = signedData?.signedUrl;
        }
        
        if (data.id_back_url) {
          const { data: signedData } = await supabase.storage
            .from('kyc_documents')
            .createSignedUrl(data.id_back_url, 3600);
          signedUrls.id_back_url = signedData?.signedUrl;
        }
        
        if (data.license_front_url) {
          const { data: signedData } = await supabase.storage
            .from('kyc_documents')
            .createSignedUrl(data.license_front_url, 3600);
          signedUrls.license_front_url = signedData?.signedUrl;
        }
        
        if (data.license_back_url) {
          const { data: signedData } = await supabase.storage
            .from('kyc_documents')
            .createSignedUrl(data.license_back_url, 3600);
          signedUrls.license_back_url = signedData?.signedUrl;
        }
        
        setKycData({ ...data, ...signedUrls });
      } else {
        setKycData(data);
      }
      
      if (data) {
        setNewStatus(data.status);
        setRejectionReason(data.rejection_reason || "");
      }
    } catch (error: any) {
      console.error("Error fetching KYC:", error);
      toast.error("Error al cargar datos KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);

      if (newStatus === "rejected" && !rejectionReason.trim()) {
        toast.error("Debes especificar un motivo de rechazo");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('admin-kyc-update-status', {
        body: {
          user_id: user.id,
          status: newStatus,
          rejection_reason: newStatus === "rejected" ? rejectionReason.trim() : null
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast.success("Estado KYC actualizado correctamente");
      await fetchKYCData();
      onUpdate();
    } catch (error: any) {
      console.error("Error updating KYC:", error);
      toast.error("Error al actualizar KYC: " + (error.message || "Error desconocido"));
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <FileCheck className="h-5 w-5 text-green-500" />;
      case "rejected": return <FileX className="h-5 w-5 text-red-500" />;
      case "pending": return <Clock className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      verified: "Verificado",
      pending: "Pendiente",
      rejected: "Rechazado"
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "verified": return "success";
      case "rejected": return "destructive";
      case "pending": return "warning";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!kycData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sin Datos KYC</CardTitle>
          <CardDescription>
            Este usuario no ha completado el proceso KYC todavía.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(kycData.status)}
            Estado Actual: {getStatusLabel(kycData.status)}
          </CardTitle>
          <CardDescription>
            {kycData.reviewed_at && (
              <span>
                Revisado el {new Date(kycData.reviewed_at).toLocaleString('es-VE')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Images */}
          <div className="space-y-4">
            <div>
              <Label>Documentos de Identidad</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {kycData.id_front_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cédula - Frontal</p>
                    <a href={kycData.id_front_url} target="_blank" rel="noopener noreferrer">
                      <img src={kycData.id_front_url} alt="ID Front" className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                    </a>
                  </div>
                )}
                {kycData.id_back_url && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cédula - Reverso</p>
                    <a href={kycData.id_back_url} target="_blank" rel="noopener noreferrer">
                      <img src={kycData.id_back_url} alt="ID Back" className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {(kycData.license_front_url || kycData.license_back_url) && (
              <div>
                <Label>Licencia de Conducir</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {kycData.license_front_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Licencia - Frontal</p>
                      <a href={kycData.license_front_url} target="_blank" rel="noopener noreferrer">
                        <img src={kycData.license_front_url} alt="License Front" className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}
                  {kycData.license_back_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Licencia - Reverso</p>
                      <a href={kycData.license_back_url} target="_blank" rel="noopener noreferrer">
                        <img src={kycData.license_back_url} alt="License Back" className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {kycData.id_number && (
            <div>
              <Label>Número de Cédula</Label>
              <div className="text-sm font-mono mt-1">{kycData.id_number}</div>
            </div>
          )}

          {kycData.driver_license_number && (
            <div>
              <Label>Número de Licencia</Label>
              <div className="text-sm font-mono mt-1">{kycData.driver_license_number}</div>
            </div>
          )}

          {kycData.rejection_reason && (
            <div>
              <Label className="text-destructive">Motivo de Rechazo</Label>
              <div className="text-sm mt-1 p-3 bg-destructive/10 rounded-md">
                {kycData.rejection_reason}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Cambiar Estado</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Pendiente</Badge>
                </div>
              </SelectItem>
              <SelectItem value="verified">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Verificado</Badge>
                </div>
              </SelectItem>
              <SelectItem value="rejected">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Rechazado</Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {newStatus === "rejected" && (
          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Motivo de Rechazo *</Label>
            <Textarea
              id="rejection_reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explica por qué se rechaza el KYC..."
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        <Button 
          onClick={handleUpdateStatus} 
          disabled={saving || (newStatus === "rejected" && !rejectionReason.trim())} 
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              <FileCheck className="mr-2 h-4 w-4" />
              Actualizar Estado KYC
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
