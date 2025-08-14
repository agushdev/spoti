"use client";

import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ImageUploadDropzone } from './image-upload-dropzone'; // ✅ Importar el nuevo componente

export function CreatePlaylistButton() {
  const [playlistName, setPlaylistName] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null); // ✅ Nuevo estado para el archivo de imagen
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast({
        title: "Nombre de playlist vacío",
        description: "El nombre de la playlist no puede estar vacío.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`;
      
      console.log("Intentando crear playlist en:", `${apiBaseUrl}/api/playlists`);

      const formData = new FormData(); // ✅ Usar FormData para enviar archivos y datos de formulario
      formData.append("name", playlistName);
      if (selectedImageFile) {
        formData.append("artwork_file", selectedImageFile); // ✅ Añadir el archivo de imagen
      }

      const response = await fetch(`${apiBaseUrl}/api/playlists`, {
        method: 'POST',
        // No establecer 'Content-Type' cuando se usa FormData; el navegador lo hace automáticamente
        // con el boundary correcto para archivos.
        // headers: { 'Accept': 'application/json' }, 
        body: formData, // ✅ Enviar FormData
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error al crear playlist: Status ${response.status}, Body: ${errorBody}`);
        let errorMessage = "Hubo un error al crear la playlist.";
        try {
          const errorJson = JSON.parse(errorBody);
          if (errorJson.detail) {
            errorMessage = errorJson.detail;
          }
        } catch (e) {
          errorMessage = errorBody || errorMessage;
        }

        toast({
          title: "Error al crear playlist",
          description: errorMessage,
          variant: "destructive",
        });
        throw new Error(`API Error: ${errorMessage}`);
      }

      setPlaylistName("");
      setSelectedImageFile(null); // ✅ Limpiar el archivo seleccionado
      setIsDialogOpen(false);
      
      toast({
        title: "Playlist creada",
        description: "Tu nueva playlist ha sido creada exitosamente.",
        variant: "default",
      });
      window.location.reload(); 
    } catch (error) {
      console.error("Error creando playlist:", error);
      toast({
        title: "Error de red",
        description: "No se pudo conectar con el servidor. Verifica tu conexión o que el backend esté activo.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileChange = useCallback((file: File | null) => {
    setSelectedImageFile(file);
  }, []);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Nueva playlist</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear nueva playlist</DialogTitle>
          <DialogDescription>
            Ingresa un nombre para tu nueva playlist y una carátula.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              className="col-span-3"
              disabled={isCreating}
            />
          </div>
          {/* ✅ Sección para la subida de imagen */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="artwork" className="text-center md:text-left">
              Carátula de la Playlist
            </Label>
            <ImageUploadDropzone 
              onFileSelected={handleFileChange} 
              disabled={isCreating}
              currentPreviewUrl={selectedImageFile ? URL.createObjectURL(selectedImageFile) : undefined}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreatePlaylist} disabled={isCreating}>
            {isCreating ? "Creando..." : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}