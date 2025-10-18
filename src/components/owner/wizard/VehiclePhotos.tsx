import { useState } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VehiclePhotosProps {
  vehicleId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function VehiclePhotos({ vehicleId, photos, onPhotosChange }: VehiclePhotosProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 10) {
      toast.error("Máximo 10 fotos por vehículo");
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} no es una imagen válida`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera el tamaño máximo de 5MB`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('vehicle_photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle_photos')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      onPhotosChange([...photos, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} foto(s) subida(s)`);
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      toast.error('Error al subir fotos');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          type="file"
          id="photo-upload"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading || photos.length >= 10}
          className="hidden"
        />
        <label
          htmlFor="photo-upload"
          className={`cursor-pointer ${uploading || photos.length >= 10 ? 'opacity-50' : ''}`}
        >
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm font-medium">
            {uploading ? 'Subiendo...' : 'Haz clic o arrastra fotos aquí'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Mínimo 6 fotos, máximo 10. PNG, JPG hasta 5MB cada una.
          </p>
          <p className="text-xs text-muted-foreground">
            {photos.length} de 10 fotos subidas
          </p>
        </label>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Foto principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length < 6 && (
        <p className="text-sm text-amber-600">
          ⚠️ Necesitas al menos 6 fotos para publicar tu vehículo
        </p>
      )}
    </div>
  );
}