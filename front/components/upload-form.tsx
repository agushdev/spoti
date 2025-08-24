"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner"; 

export function UploadForm() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [duration, setDuration] = useState(""); 
  const [audioUrl, setAudioUrl] = useState(""); // Cambiado de File a string para URL
  const [coverArtUrl, setCoverArtUrl] = useState(""); // Cambiado de File a string para URL
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validar campos obligatorios, incluyendo la URL de audio
    if (!title || !artist || !album || !duration || !audioUrl) {
      toast.error("Error al subir", {
        description: "Por favor, completa todos los campos obligatorios (Título, Artista, Álbum, Duración, URL de Audio).",
        duration: 5000,
      });
      setIsLoading(false);
      return;
    }

    // Objeto con los datos a enviar al backend
    const trackData = {
      title,
      artist,
      album,
      duration,
      audio_url: audioUrl, // Enviar la URL de audio
      cover_art_url: coverArtUrl, // Enviar la URL de la carátula (opcional)
    };

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Cambiar el tipo de contenido a JSON
        },
        body: JSON.stringify(trackData), // Enviar los datos como JSON
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
      setAudioUrl("");
      setCoverArtUrl("");

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
          type="text" 
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="MM:SS"
          required
        />
      </div>

      {/* Campo para la URL del archivo de audio */}
      <div>
        <Label htmlFor="audio-url-input">URL del Archivo de Audio</Label>
        <Input
          id="audio-url-input"
          type="url" // Cambiado a tipo "url"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          placeholder="https://ejemplo.com/cancion.mp3"
          required
        />
      </div>

      {/* Campo para la URL de la carátula */}
      <div>
        <Label htmlFor="cover-art-url-input">URL de la Carátula del Álbum (Opcional)</Label>
        <Input
          id="cover-art-url-input"
          type="url" // Cambiado a tipo "url"
          value={coverArtUrl}
          onChange={(e) => setCoverArtUrl(e.target.value)}
          placeholder="https://ejemplo.com/caratula.jpg"
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