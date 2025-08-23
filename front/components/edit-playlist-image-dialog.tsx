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
import { ImageUploadDropzone } from "./image-upload-dropzone"; 
import { toast } from 'sonner';

type EditPlaylistImageDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: number | null; 
  currentImageUrl: string | null;
  onImageUpdated: () => void; 
  onUpdateImageUrl: (imageUrl: string | null) => Promise<void>; 
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
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

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
      const formData = new FormData();
      if (selectedFile) {
        formData.append("artwork_file", selectedFile); 
      } else if (currentImageUrl && !selectedFile) {
        // Si no hay nuevo archivo y ya hay una imagen, significa que el usuario no la cambió, o la quitó
        // Si la quitó, el `selectedFile` sería `null` y `currentImageUrl` se pasaría como `null` a `onUpdateImageUrl`
        // Si no la quitó y solo cerró el diálogo, no debería hacer nada aquí,
        // pero el `onUpdateImageUrl` se usará para forzar un "null" si se borra explícitamente.
      } else {
        // Si no hay archivo seleccionado y no hay currentImageUrl, significa que no hay imagen.
        // Podríamos enviar un null al backend para borrar la imagen existente si la hubiera.
      }

      if (!selectedFile && !currentImageUrl && !formData.has("artwork_file")) {
        toast.info("No se seleccionó una nueva imagen.");
        onOpenChange(false);
        return;
      }
      
      if (selectedFile === null && currentImageUrl !== null) {
          await onUpdateImageUrl(null);
          toast.success("Carátula eliminada exitosamente.");
          onOpenChange(false);
          onImageUpdated();
          return;
      }

      if (selectedFile) {
          const response = await fetch(`${API_BASE_URL}/api/playlists/${playlistId}/artwork`, { 
              method: 'PATCH', 
              body: formData, 
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error(`Error al subir imagen: Status: ${response.status}, Body: ${errorText}`);
              throw new Error(`Error al subir imagen: ${errorText}`);
          }
          const data = await response.json();
          await onUpdateImageUrl(data.artwork_url);
          toast.success("Carátula actualizada exitosamente.");

      } else {
          // Si no hay selectedFile y el currentImageUrl era nulo, o si ya se manejó el caso de eliminación
          // y el usuario simplemente abrió y cerró sin cambios, no hacemos nada aquí.
      }

      onOpenChange(false); 
      onImageUpdated(); 
    } catch (error: any) {
      console.error("Error al guardar la imagen de la playlist:", error);
      toast.error("Error al guardar la imagen", { description: error.message || "Intenta de nuevo." });
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, selectedFile, currentImageUrl, onOpenChange, onImageUpdated, onUpdateImageUrl, API_BASE_URL]);

  if (playlistId === null) {
    return null; 
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