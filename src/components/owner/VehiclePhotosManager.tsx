import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, StarOff, GripVertical } from "lucide-react";
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

interface Photo {
  id: string;
  url: string;
  sort_order: number;
}

interface VehiclePhotosManagerProps {
  vehicleId: string | null;
  vehicleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VehiclePhotosManager({
  vehicleId,
  vehicleTitle,
  open,
  onOpenChange,
  onSuccess,
}: VehiclePhotosManagerProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);

  useEffect(() => {
    if (vehicleId && open) {
      fetchPhotos();
    }
  }, [vehicleId, open]);

  const fetchPhotos = async () => {
    if (!vehicleId) return;

    try {
      const { data, error } = await supabase
        .from("vehicle_photos")
        .select("id, url, sort_order")
        .eq("vehicle_id", vehicleId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Error al cargar fotos");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !vehicleId) return;

    if (photos.length + files.length > 10) {
      toast.error("Máximo 10 fotos por vehículo");
      return;
    }

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} no es una imagen válida`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} supera el tamaño máximo de 5MB`);
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${vehicleId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle_photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("vehicle_photos").getPublicUrl(filePath);

        const nextOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0;

        const { error: insertError } = await supabase.from("vehicle_photos").insert({
          vehicle_id: vehicleId,
          url: publicUrl,
          sort_order: nextOrder,
        });

        if (insertError) throw insertError;
      }

      await fetchPhotos();
      toast.success("Fotos subidas correctamente");
      onSuccess();
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error("Error al subir fotos");
    } finally {
      setUploading(false);
    }
  };

  const handleSetCover = async (photoId: string) => {
    // This feature requires the migration to be run first
    toast.info("Ejecuta la migración SQL primero para habilitar esta función");
    return;

    /* Uncomment after running migration
    if (!vehicleId) return;

    try {
      await supabase
        .from("vehicle_photos")
        .update({ is_cover: false })
        .eq("vehicle_id", vehicleId);

      const { error } = await supabase
        .from("vehicle_photos")
        .update({ is_cover: true })
        .eq("id", photoId);

      if (error) throw error;

      await fetchPhotos();
      toast.success("Portada actualizada");
      onSuccess();
    } catch (error) {
      console.error("Error setting cover:", error);
      toast.error("Error al cambiar portada");
    }
    */
  };

  const handleDeletePhoto = async () => {
    if (!deletePhoto || !vehicleId) return;

    setLoading(true);
    try {
      // Extract path from URL
      const url = new URL(deletePhoto.url);
      const path = url.pathname.split("/vehicle_photos/")[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("vehicle_photos")
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("vehicle_photos")
        .delete()
        .eq("id", deletePhoto.id);

      if (dbError) throw dbError;

      await fetchPhotos();
      toast.success("Foto eliminada");
      onSuccess();
      setDeletePhoto(null);
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Error al eliminar foto");
    } finally {
      setLoading(false);
    }
  };

  const movePhoto = async (photoId: string, direction: "up" | "down") => {
    const currentIndex = photos.findIndex((p) => p.id === photoId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= photos.length) return;

    const newPhotos = [...photos];
    [newPhotos[currentIndex], newPhotos[newIndex]] = [newPhotos[newIndex], newPhotos[currentIndex]];

    try {
      // Update sort order
      for (let i = 0; i < newPhotos.length; i++) {
        await supabase
          .from("vehicle_photos")
          .update({ sort_order: i })
          .eq("id", newPhotos[i].id);
      }

      setPhotos(newPhotos);
      onSuccess();
    } catch (error) {
      console.error("Error reordering photos:", error);
      toast.error("Error al reordenar fotos");
    }
  };

  if (!vehicleId) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Fotos</DialogTitle>
            <DialogDescription>
              Fotos del vehículo: {vehicleTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                id="photo-upload-manager"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || photos.length >= 10}
                className="hidden"
              />
              <label
                htmlFor="photo-upload-manager"
                className={`cursor-pointer ${
                  uploading || photos.length >= 10 ? "opacity-50" : ""
                }`}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">
                  {uploading ? "Subiendo..." : "Añadir más fotos"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {photos.length} de 10 fotos
                </p>
              </label>
            </div>

            {/* Photos Grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border"
                  >
                    <img
                      src={photo.url}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      {/* Cover indicator (first photo is cover) */}
                      {index === 0 && (
                        <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Portada
                        </div>
                      )}

                      {/* Reorder buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => movePhoto(photo.id, "up")}
                          disabled={index === 0}
                          className="min-h-[44px]"
                          aria-label="Mover arriba"
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => movePhoto(photo.id, "down")}
                          disabled={index === photos.length - 1}
                          className="min-h-[44px]"
                          aria-label="Mover abajo"
                        >
                          ↓
                        </Button>
                      </div>

                      {/* Delete */}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletePhoto(photo)}
                        className="min-h-[44px]"
                        aria-label="Eliminar foto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePhoto} onOpenChange={() => setDeletePhoto(null)}>
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
              onClick={handleDeletePhoto}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
