"use client";

import { useEffect, useState } from "react";
import { CreatePlaylistButton } from "@/components/create-playlist-button";
import { PlaylistCard } from "@/components/playlist-card";
import Link from "next/link";
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";


type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string;
  audio_url: string;
};

type Playlist = {
  id: number;
  name: string;
  tracks: Track[];
  artwork_url?: string | null; 
};

export default function BibliotecaPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'; 

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const apiUrl = `${API_BASE_URL}/api/playlists`;
        console.log("Fetching playlists from:", apiUrl); // log temporalmente para verificar la URL

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
          toast({
            title: "Error al cargar playlists",
            description: `No se pudieron cargar tus playlists. Estado: ${response.status}. Mensaje: ${errorText.substring(0, 100)}`,
            variant: "destructive",
          });
          throw new Error(`Error al obtener las playlists: ${response.status} - ${errorText}`);
        }
        const data: Playlist[] = await response.json();
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor de música. Asegúrate de que tu backend está activo y accesible.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylists();
  }, [API_BASE_URL, toast]); 

  if (isLoading) {
    return <div className="p-10 text-center text-neutral-500">Cargando tu biblioteca...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tu Biblioteca</h1>
        <CreatePlaylistButton />
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Playlists</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {playlists.length === 0 ? (
            <p className="text-neutral-500 col-span-full">Aún no tienes playlists. Crea la primera.</p>
          ) : (
            playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                <PlaylistCard
                  title={playlist.name}
                  count={playlist.tracks.length}
                  coverUrl={playlist.artwork_url || (playlist.tracks.length > 0 ? playlist.tracks[0].artwork_url : "/minimal-covers-grid.png")}
                />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}