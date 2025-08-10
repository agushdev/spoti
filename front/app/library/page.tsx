"use client";

import { useEffect, useState } from "react";
import { CreatePlaylistButton } from "@/components/create-playlist-button";
import { PlaylistCard } from "@/components/playlist-card";
import Link from "next/link";
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Definir el tipo de Playlist para el frontend, incluyendo las canciones
type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
};

type Playlist = {
  id: number;
  name: string;
  tracks: Track[];
};

export default function BibliotecaPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylists() {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000';
        const response = await fetch(`${apiBaseUrl}/api/playlists`, {
          headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP Error: ${response.status} ${response.statusText}, Body: ${errorText}`);
          throw new Error('Failed to fetch playlists');
        }
        const data: Playlist[] = await response.json();
        console.log("Playlists data:", data);
        setPlaylists(data);
      } catch (error) {
        console.error("Error fetching playlists:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylists();
  }, []);

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
            playlists.map((playlist) => {
              
              let playlistCoverUrl = "/minimal-covers-grid.png"; // Placeholder por defecto desde /public

              // Si hay canciones y la primera tiene una artwork_url válida
              if (playlist.tracks.length > 0 && playlist.tracks[0].artwork_url) {
                const artworkUrl = playlist.tracks[0].artwork_url.trim();
                // Si artworkUrl es una ruta relativa (ej: "/cover_art/piti.jpg")
                if (artworkUrl.startsWith('/')) {
                  playlistCoverUrl = artworkUrl;
                } 
                // Si es una URL completa (ej: "http://example.com/image.jpg")
                else if (artworkUrl.startsWith('http://') || artworkUrl.startsWith('https://')) {
                  playlistCoverUrl = artworkUrl; 
                }
                // Si es solo un nombre de archivo (ej: "piti.jpg"), asume que está en public/cover_art
                else if (artworkUrl !== '') {
                    playlistCoverUrl = `/cover_art/${artworkUrl}`;
                }
              }

              return (
                <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                  <PlaylistCard
                    title={playlist.name}
                    count={playlist.tracks.length}
                    coverUrl={playlistCoverUrl} // Pasa la URL cuidadosamente construida
                  />
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}