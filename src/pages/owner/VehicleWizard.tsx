import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Save, Send, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { VehicleBasicInfo } from "@/components/owner/wizard/VehicleBasicInfo";
import { VehiclePhotos } from "@/components/owner/wizard/VehiclePhotos";
import { VehiclePricing } from "@/components/owner/wizard/VehiclePricing";
import { VehicleAvailability } from "@/components/owner/wizard/VehicleAvailability";
import { VehicleRules } from "@/components/owner/wizard/VehicleRules";
import { VehicleReview } from "@/components/owner/wizard/VehicleReview";

const STEPS = [
  { id: 1, title: "Requisitos", description: "Verificación KYC y roles" },
  { id: 2, title: "Datos del vehículo", description: "Información básica" },
  { id: 3, title: "Fotos", description: "Mínimo 6 fotos" },
  { id: 4, title: "Documentos", description: "Opcional con OCR" },
  { id: 5, title: "Precios", description: "Tarifas y políticas" },
  { id: 6, title: "Disponibilidad", description: "Calendario y logística" },
  { id: 7, title: "Reglas", description: "Seguridad y restricciones" },
  { id: 8, title: "Revisión", description: "Confirmar y publicar" },
];

export default function VehicleWizard() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [hasOwnerRole, setHasOwnerRole] = useState(false);
  const [vehicleData, setVehicleData] = useState<any>({
    type: 'sedan',
    currency: 'VES',
    min_rental_days: 1,
    km_included: 200,
    cancellation_policy: 'flexible',
    delivery_type: 'both',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    checkPrerequisites();
    if (id) {
      loadVehicleData(id);
    } else {
      setLoading(false);
    }
  }, [user, id]);

  // Redirect to KYC if not verified (unless we're on step 1 showing the message)
  useEffect(() => {
    if (!loading && kycStatus !== null && kycStatus !== 'verified' && currentStep !== 1) {
      toast.error('Debes completar tu verificación KYC antes de publicar un vehículo');
      navigate('/kyc');
    }
  }, [loading, kycStatus, currentStep, navigate]);

  const checkPrerequisites = async () => {
    if (!user) return;

    try {
      // Check KYC status
      const { data: kycData } = await supabase
        .from('kyc_verifications')
        .select('status')
        .eq('user_id', user.id)
        .single();
      
      setKycStatus(kycData?.status || null);

      // Check owner role
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'owner');
      
      setHasOwnerRole((rolesData?.length || 0) > 0);

    } catch (error) {
      console.error('Error checking prerequisites:', error);
    }
  };

  const loadVehicleData = async (vehicleId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('owner_id', user?.id)
        .single();

      if (error) throw error;
      setVehicleData(data);
    } catch (error) {
      console.error('Error loading vehicle:', error);
      toast.error('Error al cargar el vehículo');
      navigate('/owner/vehicles');
    } finally {
      setLoading(false);
    }
  };

  const updateVehicleData = (field: string, value: any) => {
    setVehicleData((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveAsDraft = async () => {
    if (!user) return;

    try {
      const dataToSave = {
        ...vehicleData,
        owner_id: user.id,
        status: 'draft',
      };

      if (id) {
        const { error } = await supabase
          .from('vehicles')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(dataToSave);
        if (error) throw error;
      }

      toast.success('Guardado como borrador');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error('Error al guardar borrador');
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDelete = async () => {
    if (!id || !user) return;

    try {
      // Check for active reservations
      const { data: reservations } = await supabase
        .from('reservations')
        .select('id')
        .eq('vehicle_id', id)
        .in('status', ['approved' as any, 'pending'])
        .gte('end_at', new Date().toISOString())
        .limit(1);

      if (reservations && reservations.length > 0) {
        toast.error('No puedes eliminar: hay reservas activas o próximas');
        return;
      }

      // Soft delete
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'paused'
        })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;

      toast.success('Vehículo eliminado correctamente');
      navigate('/owner/vehicles');
    } catch (error: any) {
      console.error('Error deleting vehicle:', error);
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate required fields
    if (!vehicleData.brand || !vehicleData.model || !vehicleData.year || !vehicleData.type || !vehicleData.title || !vehicleData.city) {
      toast.error('Completa todos los campos obligatorios');
      setCurrentStep(2);
      return;
    }

    if (photos.length < 6) {
      toast.error('Necesitas al menos 6 fotos');
      setCurrentStep(3);
      return;
    }

    if (!vehicleData.price_bs || vehicleData.price_bs <= 0) {
      toast.error('Establece un precio válido');
      setCurrentStep(5);
      return;
    }

    try {
      const dataToSubmit = {
        ...vehicleData,
        owner_id: user.id,
        status: 'pending_review',
      };

      console.log('Submitting vehicle data:', dataToSubmit);

      let vehicleId = id;

      if (id) {
        const { error } = await supabase
          .from('vehicles')
          .update(dataToSubmit)
          .eq('id', id);
        if (error) {
          console.error('Update error:', error);
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('vehicles')
          .insert(dataToSubmit)
          .select()
          .single();
        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        vehicleId = data.id;
      }

      // Save photos
      if (vehicleId && photos.length > 0) {
        // Delete existing photos
        await supabase
          .from('vehicle_photos')
          .delete()
          .eq('vehicle_id', vehicleId);

        // Insert new photos
        const photoRecords = photos.map((url, index) => ({
          vehicle_id: vehicleId,
          url,
          sort_order: index,
        }));

        const { error: photosError } = await supabase
          .from('vehicle_photos')
          .insert(photoRecords);
        
        if (photosError) {
          console.error('Photos error:', photosError);
          throw photosError;
        }
      }

      toast.success('Vehículo enviado a revisión');
      navigate('/owner/vehicles');
    } catch (error: any) {
      console.error('Error submitting vehicle:', error);
      toast.error('Error al enviar el vehículo: ' + (error.message || 'Error desconocido'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Step 1: Prerequisites check
  if (currentStep === 1) {
    const canProceed = kycStatus === 'verified' && hasOwnerRole;

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/owner')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Publicar mi vehículo</h1>
                <p className="text-muted-foreground">Paso {currentStep} de {STEPS.length}</p>
              </div>
            </div>

            <Progress value={(currentStep / STEPS.length) * 100} className="w-full" />

            <Card>
              <CardHeader>
                <CardTitle>Requisitos previos</CardTitle>
                <CardDescription>Verifica que cumples con los requisitos para publicar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* KYC Status */}
                {kycStatus !== 'verified' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verificación KYC requerida</AlertTitle>
                    <AlertDescription>
                      Debes completar tu verificación KYC para poder publicar vehículos.
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => navigate('/kyc')}
                      >
                        Completar KYC
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {kycStatus === 'verified' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>✓ KYC Verificado</AlertTitle>
                    <AlertDescription>Tu identidad ha sido verificada correctamente.</AlertDescription>
                  </Alert>
                )}

                {/* Owner Role */}
                {!hasOwnerRole && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Rol de propietario requerido</AlertTitle>
                    <AlertDescription>
                      Necesitas el rol de propietario para publicar vehículos.
                      <p className="mt-2 text-sm">Contacta a soporte para activar este rol.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {hasOwnerRole && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>✓ Rol de propietario activo</AlertTitle>
                    <AlertDescription>Tienes permisos para publicar vehículos.</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    onClick={handleNext} 
                    disabled={!canProceed}
                    className="gap-2"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Render appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 2:
        return <VehicleBasicInfo data={vehicleData} onChange={updateVehicleData} />;
      case 3:
        return <VehiclePhotos vehicleId={id} photos={photos} onPhotosChange={setPhotos} />;
      case 4:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              La subida de documentos es opcional. Puedes continuar sin subir documentos.
            </p>
            <p className="text-sm text-muted-foreground">
              Esta funcionalidad con OCR estará disponible próximamente.
            </p>
          </div>
        );
      case 5:
        return <VehiclePricing data={vehicleData} onChange={updateVehicleData} />;
      case 6:
        return <VehicleAvailability data={vehicleData} onChange={updateVehicleData} />;
      case 7:
        return <VehicleRules data={vehicleData} onChange={updateVehicleData} />;
      case 8:
        return <VehicleReview data={vehicleData} photos={photos} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/owner/vehicles')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold">
                    {id ? 'Editar vehículo' : 'Publicar mi vehículo'}
                  </h1>
                  <p className="text-muted-foreground">Paso {currentStep} de {STEPS.length}</p>
                </div>
              </div>
              
              {/* Delete button (only in edit mode) */}
              {id && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </Button>
              )}
            </div>

          <Progress value={(currentStep / STEPS.length) * 100} className="w-full" />

          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderStepContent()}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handlePrevious} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button variant="outline" onClick={saveAsDraft} className="gap-2">
                      <Save className="h-4 w-4" />
                      Guardar borrador
                    </Button>
                  )}

                  {currentStep < STEPS.length ? (
                    <Button onClick={handleNext} className="gap-2">
                      Continuar
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit} className="gap-2">
                      <Send className="h-4 w-4" />
                      Enviar a revisión
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta publicación?</AlertDialogTitle>
            <AlertDialogDescription>
              El vehículo será archivado y dejará de aparecer en búsquedas. No podrás eliminarlo si tiene reservas activas o próximas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
