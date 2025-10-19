import { useState } from "react";
import { Upload, X, ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

interface VehiclePhotosProps {
  vehicleId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export function VehiclePhotos({ vehicleId, photos, onPhotosChange }: VehiclePhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

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

  const handleDeleteConfirm = async () => {
    if (deleteIndex === null) return;

    try {
      const photoUrl = photos[deleteIndex];
      
      // If photo is already uploaded to storage, delete it
      if (photoUrl.includes('supabase.co') && vehicleId) {
        try {
          const url = new URL(photoUrl);
          const path = url.pathname.split('/vehicle_photos/')[1];
          
          if (path) {
            const { error: storageError } = await supabase.storage
              .from('vehicle_photos')
              .remove([path]);
            
            if (storageError) {
              console.error('Error deleting from storage:', storageError);
            }

            // Also delete from database if exists
            const { error: dbError } = await supabase
              .from('vehicle_photos')
              .delete()
              .eq('vehicle_id', vehicleId)
              .eq('url', photoUrl);
            
            if (dbError) {
              console.error('Error deleting from database:', dbError);
            }
          }
        } catch (error) {
          console.error('Error parsing photo URL:', error);
        }
      }

      // Remove from state
      const newPhotos = photos.filter((_, i) => i !== deleteIndex);
      onPhotosChange(newPhotos);
      toast.success('Foto eliminada');
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Error al eliminar foto');
    } finally {
      setDeleteIndex(null);
    }
  };

  const movePhoto = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[index]];
    onPhotosChange(newPhotos);
    toast.success('Orden actualizado');
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
              
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {/* Reorder buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => movePhoto(index, 'up')}
                    disabled={index === 0}
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Mover arriba"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => movePhoto(index, 'down')}
                    disabled={index === photos.length - 1}
                    className="min-h-[44px] min-w-[44px]"
                    aria-label="Mover abajo"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Delete button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteIndex(index)}
                  className="min-h-[44px]"
                  aria-label="Eliminar foto"
                >
                  <X className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
              
              {/* Cover badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La foto se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}