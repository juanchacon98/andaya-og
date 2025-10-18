import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IDDocumentScanner } from "@/components/ocr/IDDocumentScanner";
import { VehicleDocumentScanner } from "@/components/ocr/VehicleDocumentScanner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldCheck, FileText, Car, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const KYC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [idData, setIdData] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchKYCStatus();
    }
  }, [user]);

  const fetchKYCStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("status")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      setKycStatus(data?.status || null);
    } catch (error) {
      console.error("Error fetching KYC status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIDDataExtracted = (data: any) => {
    setIdData(data);
    toast.success("Datos de cédula extraídos correctamente");
  };

  const handleVehicleDataExtracted = (data: any) => {
    setVehicleData(data);
    toast.success("Datos del vehículo extraídos correctamente");
  };

  const handleSubmitKYC = async () => {
    if (!user) return;

    if (!idData) {
      toast.error("Por favor, completa el escaneo de tu cédula");
      return;
    }

    try {
      const { error } = await supabase.from("kyc_verifications").upsert({
        user_id: user.id,
        id_number: idData.documentNumber,
        status: "pending",
      });

      if (error) throw error;

      // Update profile with KYC status
      await supabase
        .from("profiles")
        .update({ role: "renter" })
        .eq("id", user.id);

      toast.success("Verificación KYC enviada", {
        description: "Tu solicitud está siendo revisada. Te notificaremos cuando esté aprobada.",
      });

      navigate("/perfil");
    } catch (error) {
      console.error("Error submitting KYC:", error);
      toast.error("Error al enviar la verificación", {
        description: "Por favor, intenta de nuevo más tarde.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {kycStatus === "approved" ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : kycStatus === "rejected" ? (
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium">Estado de Verificación</p>
                      <p className="text-sm text-muted-foreground">
                        {kycStatus === "approved" && "Tu verificación ha sido aprobada"}
                        {kycStatus === "pending" && "Tu verificación está siendo revisada"}
                        {kycStatus === "rejected" && "Tu verificación fue rechazada. Por favor, intenta nuevamente."}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      kycStatus === "approved"
                        ? "default"
                        : kycStatus === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {kycStatus === "approved" && "Aprobado"}
                    {kycStatus === "pending" && "Pendiente"}
                    {kycStatus === "rejected" && "Rechazado"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                Proceso de Verificación
              </CardTitle>
              <CardDescription>
                Usa nuestro sistema de OCR gratuito para extraer automáticamente los datos de tus documentos.
                Todo se procesa en tu navegador de forma privada y segura.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="identity" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="identity" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Cédula de Identidad
                  </TabsTrigger>
                  <TabsTrigger value="vehicle" className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Carnet del Vehículo (Opcional)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="identity" className="mt-6">
                  <IDDocumentScanner onDataExtracted={handleIDDataExtracted} />
                </TabsContent>

                <TabsContent value="vehicle" className="mt-6">
                  <VehicleDocumentScanner onDataExtracted={handleVehicleDataExtracted} />
                </TabsContent>
              </Tabs>

              {idData && (
                <div className="mt-6">
                  <Button onClick={handleSubmitKYC} className="w-full" size="lg">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Enviar Verificación KYC
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Privacidad y Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• El OCR se procesa completamente en tu navegador usando Tesseract.js</p>
              <p>• Tus imágenes no se suben a ningún servidor durante el procesamiento</p>
              <p>• Solo los datos extraídos (texto) se guardan en nuestra base de datos</p>
              <p>• Puedes revisar y corregir cualquier dato antes de enviarlo</p>
              <p>• Si la confianza del OCR es menor al 80%, te pediremos una foto más clara</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KYC;

