"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { ImageUploadDropzone } from "./image-upload-dropzone"; // ✅ Importamos el componente de subida de imagen

type AddPlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlaylistCreated: () => void; // Callback para notificar al padre
};

export function AddPlaylistDialog({
  open,
  onOpenChange,
  onPlaylistCreated,
}: AddPlaylistDialogProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // ✅ Nuevo estado para la imagen seleccionada
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Callback para manejar la selección de imagen desde ImageUploadDropzone
  const handleImageSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
  }, []);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast.error("El nombre de la playlist no puede estar vacío.");
      return;
    }

    setIsLoading(true);
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiBaseUrl = `http://${host}:8000`;

      const formData = new FormData();
      formData.append("name", playlistName);
      if (selectedFile) {
        formData.append("artwork_file", selectedFile); // ✅ Añadir el archivo de imagen si existe
      }

      const response = await fetch(`${apiBaseUrl}/api/playlists`, {
        method: 'POST',
        // ✅ No necesitamos Content-Type si enviamos FormData, el navegador lo configura automáticamente
        // headers: { 'Content-Type': 'application/json' }, 
        body: formData, // ✅ Enviar FormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al crear playlist: Status: ${response.status}, Body: ${errorText}`);
        let description = "Hubo un error al crear la playlist.";
        if (errorText.includes("Ya existe una playlist con este nombre")) {
          description = "Ya existe una playlist con este nombre.";
        } else if (errorText.includes("Error de integridad")) {
          description = "Error de integridad al crear la playlist (el nombre puede estar duplicado).";
        }
        toast.error("Error al crear playlist", { description: description });
        throw new Error("Failed to create playlist.");
      }

      toast.success("Playlist creada exitosamente.", {
        description: `"${playlistName}" ha sido creada.`,
      });
      setPlaylistName(""); // Limpiar el campo
      setSelectedFile(null); // ✅ Limpiar la imagen seleccionada
      onOpenChange(false); // Cerrar el diálogo
      onPlaylistCreated(); // Notificar al padre para que recargue la lista
    } catch (error) {
      console.error("Error al crear playlist:", error);
      // El toast de error ya se manejó arriba para errores de red o del servidor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]"> {/* ✅ Aumentado el ancho para la imagen */}
        <DialogHeader>
          <DialogTitle>Crear nueva playlist</DialogTitle>
          <DialogDescription>
            Dale un nombre a tu nueva playlist y, opcionalmente, añade una carátula.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Campo de Nombre de Playlist */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>

          {/* ✅ Nuevo: Componente de Subida de Imagen */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <Label className="font-medium text-neutral-700">Carátula (Opcional)</Label>
            <ImageUploadDropzone 
              currentImageUrl={selectedFile ? URL.createObjectURL(selectedFile) : null} // Mostrar vista previa del archivo
              onImageSelected={handleImageSelected}
              isLoading={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleCreatePlaylist} disabled={isLoading || !playlistName.trim()}> {/* Deshabilitar si no hay nombre */}
            {isLoading ? "Creando..." : "Crear Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}