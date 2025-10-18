import { CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VehicleReviewProps {
  data: any;
  photos: string[];
}

export function VehicleReview({ data, photos }: VehicleReviewProps) {
  const isComplete = {
    basicInfo: data.brand && data.model && data.year && data.type && data.title && data.city,
    photos: photos.length >= 6,
    pricing: data.price_bs > 0,
    availability: data.delivery_type,
  };

  const allComplete = Object.values(isComplete).every(Boolean);

  return (
    <div className="space-y-6">
      {!allComplete && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Completa todos los pasos obligatorios antes de publicar
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          {isComplete.basicInfo ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium">Información básica</h4>
            {isComplete.basicInfo ? (
              <p className="text-sm text-muted-foreground">
                {data.brand} {data.model} {data.year} - {data.city}
              </p>
            ) : (
              <p className="text-sm text-amber-600">Completa los datos del vehículo</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          {isComplete.photos ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium">Fotos</h4>
            <p className="text-sm text-muted-foreground">
              {photos.length} de 6 mínimas subidas
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {isComplete.pricing ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium">Precios</h4>
            {isComplete.pricing ? (
              <p className="text-sm text-muted-foreground">Bs {data.price_bs}/día</p>
            ) : (
              <p className="text-sm text-amber-600">Establece el precio por día</p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          {isComplete.availability ? (
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
          )}
          <div>
            <h4 className="font-medium">Disponibilidad</h4>
            {isComplete.availability ? (
              <p className="text-sm text-muted-foreground capitalize">
                {data.delivery_type === 'both' ? 'Recogida y entrega' : data.delivery_type === 'pickup' ? 'Solo recogida' : 'Solo entrega'}
              </p>
            ) : (
              <p className="text-sm text-amber-600">Configura la disponibilidad</p>
            )}
          </div>
        </div>
      </div>

      {allComplete && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            ¡Perfecto! Tu vehículo está listo para ser enviado a revisión. 
            El equipo de AndaYa lo revisará y te notificará cuando esté aprobado.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}