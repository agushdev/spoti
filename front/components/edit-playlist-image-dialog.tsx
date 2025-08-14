"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageUploadDropzone } from "./image-upload-dropzone"; // Importa el componente de drag and drop de imagen
import { toast } from 'sonner';

type EditPlaylistImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: number | null; // Puede ser nulo si el diálogo se abre antes de que playlistId esté disponible
  currentImageUrl: string | null;
  onImageUpdated: () => void; // Callback para recargar los detalles de la playlist en el padre
  onUpdateImageUrl: (imageUrl: string | null) => Promise<void>; // Función para actualizar la URL de la imagen en el backend
};

export function EditPlaylistImageDialog({
  open,
  onOpenChange,
  playlistId,
  currentImageUrl,
  onImageUpdated,
  onUpdateImageUrl,
}: EditPlaylistImageDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Resetear el estado cuando el diálogo se abre o la imagen actual cambia
  useEffect(() => {
    if (open) {
      setSelectedFile(null);
    }
  }, [open]);

  const handleImageSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  const handleSaveImage = useCallback(async () => {
    if (!playlistId) {
      toast.error("Error", { description: "ID de playlist no disponible." });
      return;
    }

    setIsLoading(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`;

      const formData = new FormData();
      if (selectedFile) {
        formData.append("artwork_file", selectedFile); // Asegúrate de que el nombre del campo coincida con FastAPI
      } else if (currentImageUrl && !selectedFile) {
        // Si no hay nuevo archivo y ya hay una imagen, significa que el usuario no la cambió, o la quitó
        // Si la quitó, el `selectedFile` sería `null` y `currentImageUrl` se pasaría como `null` a `onUpdateImageUrl`
        // Si no la quitó y solo cerró el diálogo, no debería hacer nada aquí,
        // pero el `onUpdateImageUrl` se usará para forzar un "null" si se borra explícitamente.
      } else {
        // Si no hay archivo seleccionado y no hay currentImageUrl, significa que no hay imagen.
        // Podríamos enviar un null al backend para borrar la imagen existente si la hubiera.
      }

      // Si no se seleccionó un archivo y no había imagen anterior, no hay nada que guardar.
      // Si se seleccionó un archivo, o se decidió eliminar el actual, proceder.
      if (!selectedFile && !currentImageUrl && !formData.has("artwork_file")) {
        toast.info("No se seleccionó una nueva imagen.");
        onOpenChange(false);
        return;
      }
      
      // Si el archivo seleccionado es null, significa que se quiere eliminar la imagen
      if (selectedFile === null && currentImageUrl !== null) {
          // Llama a la función proporcionada para actualizar la URL a null en el backend
          await onUpdateImageUrl(null);
          toast.success("Carátula eliminada exitosamente.");
          onOpenChange(false);
          onImageUpdated();
          return;
      }


      // Si hay un archivo para subir
      if (selectedFile) {
          const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}/artwork`, { // Nuevo endpoint PATCH o POST específico
              method: 'PATCH', // O POST, dependiendo de cómo lo implementes para solo la imagen
              body: formData, // FormData para enviar el archivo
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error al subir imagen: Status: ${response.status}, Body: ${errorText}`);
              throw new Error(`Error al subir imagen: ${errorText}`);
          }
          const data = await response.json();
          // La respuesta debería incluir la nueva URL de la imagen, que usamos para actualizar la playlist
          await onUpdateImageUrl(data.artwork_url); // Llama al callback de la página para actualizar la URL
          toast.success("Carátula actualizada exitosamente.");

      } else {
          // Si no hay selectedFile y el currentImageUrl era nulo, o si ya se manejó el caso de eliminación
          // y el usuario simplemente abrió y cerró sin cambios, no hacemos nada aquí.
      }

      onOpenChange(false); // Cierra el diálogo
      onImageUpdated(); // Recarga los detalles de la playlist en el padre
    } catch (error: any) {
      console.error("Error al guardar la imagen de la playlist:", error);
      toast.error("Error al guardar la imagen", { description: error.message || "Intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, selectedFile, currentImageUrl, onOpenChange, onImageUpdated, onUpdateImageUrl]);

  // Si no hay un playlistId válido, el diálogo no debería abrirse o debería mostrar un mensaje.
  // Podrías devolver null o un mensaje de error si playlistId es null.
  if (playlistId === null) {
    return null; // O un diálogo deshabilitado con un mensaje
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Cambiar carátula de la playlist</DialogTitle>
          <DialogDescription>
            Arrastra y suelta una nueva imagen o selecciónala para tu playlist.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-4">
          <ImageUploadDropzone
            currentImageUrl={selectedFile ? URL.createObjectURL(selectedFile) : currentImageUrl}
            onImageSelected={handleImageSelected}
            isLoading={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSaveImage} disabled={isLoading || (selectedFile === null && currentImageUrl === null)}>
            {isLoading ? "Guardando..." : "Guardar carátula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}