"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner"; // Assuming you have a Spinner component

export function UploadForm() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [duration, setDuration] = useState(""); // Consider a better input type for duration later
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!title || !artist || !album || !duration || !audioFile) {
      toast.error("Error al subir", {
        description: "Por favor, completa todos los campos obligatorios (Título, Artista, Álbum, Duración, Archivo de audio).",
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("artist", artist);
    formData.append("album", album);
    formData.append("duration", duration);
    formData.append("audio_file", audioFile);
    if (coverArt) {
      formData.append("cover_art", coverArt);
    }

    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const apiBaseUrl = `http://${host}:8000`;

    try {
      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error desconocido al subir la canción.");
      }

      const result = await response.json();
      toast.success("Canción subida exitosamente", {
        description: `"${result.title}" ha sido añadida a tu biblioteca.`,
        duration: 3000,
      });

      // Reset form
      setTitle("");
      setArtist("");
      setAlbum("");
      setDuration("");
      setAudioFile(null);
      setCoverArt(null);
      const audioInput = document.getElementById("audio-file-input") as HTMLInputElement;
      if (audioInput) audioInput.value = "";
      const coverInput = document.getElementById("cover-art-file-input") as HTMLInputElement;
      if (coverInput) coverInput.value = "";

    } catch (error: any) {
      console.error("Error uploading track:", error);
      toast.error("Error al subir la canción", {
        description: error.message || "Ocurrió un error inesperado. Intenta de nuevo.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Subir Nueva Canción</h2>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título de la canción"
          required
        />
      </div>

      <div>
        <Label htmlFor="artist">Artista</Label>
        <Input
          id="artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Nombre del artista"
          required
        />
      </div>

      <div>
        <Label htmlFor="album">Álbum</Label>
        <Input
          id="album"
          type="text"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder="Nombre del álbum"
          required
        />
      </div>

      <div>
        <Label htmlFor="duration">Duración (ej. 3:45)</Label>
        <Input
          id="duration"
          type="text" // Considerar tipo "time" o máscara para un formato estricto
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="MM:SS"
          required
        />
      </div>

      <div>
        <Label htmlFor="audio-file-input">Archivo de Audio</Label>
        <Input
          id="audio-file-input"
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files ? e.target.files[0] : null)}
          required
        />
      </div>

      <div>
        <Label htmlFor="cover-art-file-input">Carátula del Álbum (Opcional)</Label>
        <Input
          id="cover-art-file-input"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverArt(e.target.files ? e.target.files[0] : null)}
        />
      </div>

      <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner size="sm" /> Subiendo...
          </>
        ) : (
          "Subir Canción"
        )}
      </Button>
    </form>
  );
}