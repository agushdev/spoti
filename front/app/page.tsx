// src/app/page.tsx
"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { TrackCard } from "@/components/track-card"; // ✅ CAMBIO: Volvemos a importar TrackCard
import { toast, Toaster } from "sonner";
import { Button } from "@/components/ui/button"; 
import { Spinner } from "@/components/ui/spinner"; 
import { SearchInput } from "@/components/search-input";

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null; 
  audio_url: string;
};

type PagedTracksResponse = {
  total: number;
  items: Track[];
};

const PAGE_SIZE = 20; 

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false); 
  const [initialLoad, setInitialLoad] = useState(true); 
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTracks = useCallback(async (page: number) => {
    setIsLoading(true);
    const offset = page * PAGE_SIZE;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:8000`;
    const url = `${apiBaseUrl}/api/tracks?limit=${PAGE_SIZE}&offset=${offset}`;

    try {
      console.log(`Fetching tracks from: ${url}`);
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error: ${response.status} ${response.statusText}, Body: ${errorText}`);
        throw new Error(`Failed to fetch tracks: ${response.statusText}`);
      }

      const data: PagedTracksResponse = await response.json();
      console.log("Fetched tracks data:", data);

      setTracks(prevTracks => {
        const newTracks = data.items.filter(newItem => !prevTracks.some(existingItem => existingItem.id === newItem.id));
        return [...prevTracks, ...newTracks];
      });

      setHasMore(data.items.length === PAGE_SIZE);

    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast.error("Error al cargar las canciones.", {
        description: "Intenta recargar la página.",
        duration: 5000,
      });
      setHasMore(false); 
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks(0); 
  }, [fetchTracks]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setCurrentPage(prevPage => prevPage + 1);
      fetchTracks(currentPage + 1);
    }
  };

  const filteredTracks = useMemo(() => {
    if (!searchTerm) {
      return tracks;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        track.artist.toLowerCase().includes(lowerCaseSearchTerm) ||
        track.album.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, tracks]);

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" /> 
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Canciones</h1>
      
      {/* Barra de búsqueda con el placeholder original */}
      <div className="mt-4 mb-6">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm} 
          placeholder="Explora por título, artista o álbum..." 
        />
      </div>

      {/* ✅ CAMBIO: Volvemos al grid original para TrackCard, eliminando las cabeceras de tabla */}
      {filteredTracks.length === 0 && !isLoading && !initialLoad ? (
        <p className="text-neutral-500 col-span-full py-4 text-center">No hay canciones disponibles que coincidan con la búsqueda.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"> {/* Grid original */}
          {filteredTracks.map((track) => (
            <TrackCard 
              key={track.id} 
              track={track} 
              queue={filteredTracks} 
            />
          ))}
        </div>
      )}

      {hasMore && filteredTracks.length > 0 && searchTerm === "" && (
        <div className="flex justify-center mt-8">
          <Button 
            onClick={handleLoadMore} 
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black border border-neutral-200 hover:bg-neutral-100 transition-colors"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" /> Cargando...
              </>
            ) : (
              "Cargar más canciones"
            )}
          </Button>
        </div>
      )}

      {!hasMore && tracks.length > 0 && searchTerm === "" && (
        <div className="text-center text-neutral-500 mt-8">
          Has llegado al final de la lista de canciones.
        </div>
      )}

      <Toaster theme="light" position="top-right" />
    </div>
  );
}
