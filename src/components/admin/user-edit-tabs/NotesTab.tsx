import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface NotesTabProps {
  userId: string;
}

export function NotesTab({ userId }: NotesTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    // Por ahora solo mostrar placeholder
    // En producción, crear tabla admin_notes
    setLoading(false);
    setNotes([]);
  }, [userId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error("La nota no puede estar vacía");
      return;
    }

    try {
      setSaving(true);
      
      // TODO: Implementar cuando se cree la tabla admin_notes
      toast.info("Funcionalidad de notas en desarrollo");
      
      setNewNote("");
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("Error al agregar nota");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Nota Interna</CardTitle>
          <CardDescription>
            Las notas solo son visibles para administradores. Útil para dejar constancia de revisiones manuales.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe una nota sobre este usuario..."
            rows={4}
            className="resize-none"
          />
          <Button onClick={handleAddNote} disabled={saving || !newNote.trim()} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Nota
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No hay notas para este usuario
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note: any) => (
            <Card key={note.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.created_at).toLocaleString('es-VE')} • Por: {note.author_email}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar nota?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
