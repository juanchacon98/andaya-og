import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const KYC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // File states
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [licenseBack, setLicenseBack] = useState<File | null>(null);
  
  // Preview states
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [licenseFrontPreview, setLicenseFrontPreview] = useState<string | null>(null);
  const [licenseBackPreview, setLicenseBackPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchKYCStatus();
    }
  }, [user]);

  const fetchKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("status, rejection_reason")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      setKycStatus(data?.status || null);
      setRejectionReason(data?.rejection_reason || null);
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (
    file: File | null, 
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void
  ) => {
    setFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${path}-${Date.now()}.${fileExt}`;
    const filePath = `${user?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('kyc_documents')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Return the path (not public URL since bucket is private)
    return filePath;
  };

  const handleSubmitKYC = async () => {
    if (!user) return;

    if (!idFront || !idBack) {
      toast.error("Por favor, sube ambos lados de tu cédula");
      return;
    }

    try {
      setUploading(true);

      // Upload files
      const idFrontUrl = await uploadFile(idFront, 'id-front');
      const idBackUrl = await uploadFile(idBack, 'id-back');
      const licenseFrontUrl = licenseFront ? await uploadFile(licenseFront, 'license-front') : null;
      const licenseBackUrl = licenseBack ? await uploadFile(licenseBack, 'license-back') : null;

      // Save to database
      const { error } = await supabase.from("kyc_verifications").upsert({
        user_id: user.id,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        license_front_url: licenseFrontUrl,
        license_back_url: licenseBackUrl,
        status: "pending",
      });

      if (error) throw error;

      // Notify admin
      await supabase.functions.invoke('notify-kyc-submission', {
        body: { user_id: user.id }
      });

      toast.success("Verificación KYC enviada", {
        description: "Tu solicitud está siendo revisada. Te notificaremos cuando esté aprobada.",
      });

      navigate("/perfil");
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("Error al enviar la verificación", {
        description: "Por favor, intenta de nuevo más tarde.",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Verificación KYC</h1>
            <p className="text-muted-foreground">
              Completa tu verificación de identidad para usar AndaYa
            </p>
          </div>

          {kycStatus && (
            <Alert variant={kycStatus === "rejected" ? "destructive" : kycStatus === "verified" ? "default" : "default"}>
              <div className="flex items-center gap-3">
                {kycStatus === "verified" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-medium mb-1">
                      {kycStatus === "verified" && "Tu verificación ha sido aprobada"}
                      {kycStatus === "pending" && "Tu verificación está siendo revisada"}
                      {kycStatus === "rejected" && "Tu verificación fue rechazada"}
                    </p>
                    {rejectionReason && (
                      <p className="text-sm mt-2 opacity-90">
                        Motivo: {rejectionReason}
                      </p>
                    )}
                  </AlertDescription>
                </div>
                <Badge
                  variant={
                    kycStatus === "verified"
                      ? "default"
                      : kycStatus === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {kycStatus === "verified" && "Aprobado"}
                  {kycStatus === "pending" && "Pendiente"}
                  {kycStatus === "rejected" && "Rechazado"}
                </Badge>
              </div>
            </Alert>
          )}

          {kycStatus !== "verified" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  Documentos de Identidad
                </CardTitle>
                <CardDescription>
                  Sube fotos claras de tus documentos. Un administrador revisará tu solicitud.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cédula de Identidad */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Cédula de Identidad *</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Front */}
                    <div className="space-y-2">
                      <Label htmlFor="id-front">Frontal</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {idFrontPreview ? (
                          <div className="relative">
                            <img src={idFrontPreview} alt="ID Front" className="w-full h-48 object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => handleFileChange(null, setIdFront, setIdFrontPreview)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="id-front" className="cursor-pointer block">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click para subir</p>
                            <Input
                              id="id-front"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null, setIdFront, setIdFrontPreview)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Back */}
                    <div className="space-y-2">
                      <Label htmlFor="id-back">Reverso</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {idBackPreview ? (
                          <div className="relative">
                            <img src={idBackPreview} alt="ID Back" className="w-full h-48 object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => handleFileChange(null, setIdBack, setIdBackPreview)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="id-back" className="cursor-pointer block">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click para subir</p>
                            <Input
                              id="id-back"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null, setIdBack, setIdBackPreview)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Licencia de Conducir (Opcional) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Licencia de Conducir (Opcional)</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Front */}
                    <div className="space-y-2">
                      <Label htmlFor="license-front">Frontal</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {licenseFrontPreview ? (
                          <div className="relative">
                            <img src={licenseFrontPreview} alt="License Front" className="w-full h-48 object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => handleFileChange(null, setLicenseFront, setLicenseFrontPreview)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="license-front" className="cursor-pointer block">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click para subir</p>
                            <Input
                              id="license-front"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null, setLicenseFront, setLicenseFrontPreview)}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Back */}
                    <div className="space-y-2">
                      <Label htmlFor="license-back">Reverso</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors">
                        {licenseBackPreview ? (
                          <div className="relative">
                            <img src={licenseBackPreview} alt="License Back" className="w-full h-48 object-cover rounded" />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2"
                              onClick={() => handleFileChange(null, setLicenseBack, setLicenseBackPreview)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="license-back" className="cursor-pointer block">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Click para subir</p>
                            <Input
                              id="license-back"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0] || null, setLicenseBack, setLicenseBackPreview)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSubmitKYC} 
                  className="w-full" 
                  size="lg"
                  disabled={!idFront || !idBack || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Subiendo documentos...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Enviar Verificación KYC
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Privacidad y Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Tus documentos se almacenan de forma segura y encriptada</p>
              <p>• Solo los administradores pueden acceder a tus documentos</p>
              <p>• Los documentos se usan únicamente para verificar tu identidad</p>
              <p>• Puedes solicitar la eliminación de tus documentos en cualquier momento</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KYC;
