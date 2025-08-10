"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
};

// Define el tipo de respuesta paginada, igual que en home/page.tsx
type PagedTracksResponse = {
  total: number;
  items: Track[];
};

type AddTrackToPlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: number;
  currentTracks: Track[];
  onPlaylistUpdated: () => void;
};

export function AddTrackToPlaylistDialog({
  open,
  onOpenChange,
  playlistId,
  currentTracks,
  onPlaylistUpdated,
}: AddTrackToPlaylistDialogProps) {
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<number>>(new Set());
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isAddingTracks, setIsAddingTracks] = useState(false);

  const fetchAvailableTracks = useCallback(async () => {
    setIsLoadingTracks(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000`; // Usar 'localhost' como fallback seguro
      // ✅ IMPORTANTE: Añade parámetros de paginación para obtener todas las pistas disponibles si es necesario
      // O ajusta el límite para que sea lo suficientemente grande para cubrir la mayoría de los casos.
      // Para este diálogo, si quieres todas las pistas, puedes usar un límite grande o un endpoint sin paginar.
      // Aquí, asumiremos un límite alto para simplificar y obtener la mayoría de las pistas.
      const response = await fetch(`${apiBaseUrl}/api/tracks?limit=1000&offset=0`, { // Límite alto para obtener todas las pistas
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching tracks: Status: ${response.status}, Body: ${errorText}`);
        throw new Error("Failed to fetch available tracks.");
      }
      // ✅ CAMBIO CLAVE: Acceder a 'data.items' porque la API ahora devuelve un objeto paginado
      const pagedData: PagedTracksResponse = await response.json(); 
      setAvailableTracks(pagedData.items); 
    } catch (error) {
      console.error("Error fetching available tracks:", error);
      toast.error("Error al cargar canciones disponibles.");
    } finally {
      setIsLoadingTracks(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAvailableTracks();
      setSelectedTrackIds(new Set());
      setSearchTerm("");
    }
  }, [open, fetchAvailableTracks]);

  const handleToggleSelect = (trackId: number) => {
    setSelectedTrackIds((prevSelected) => {
      const newSelected = new Set(prevSelected);
      // Solo permite seleccionar si la canción NO está ya en la playlist actual
      if (!currentTracks.some(t => t.id === trackId)) {
        if (newSelected.has(trackId)) {
          newSelected.delete(trackId);
        } else {
          newSelected.add(trackId);
        }
      } else {
        // Opcional: Avisar al usuario si intenta seleccionar una canción ya existente
        // toast.info("Esta canción ya está en la playlist.");
      }
      return newSelected;
    });
  };

  const handleAddSelectedTracks = async () => {
    setIsAddingTracks(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000`;
    let addedCount = 0;
    let errorCount = 0;

    for (const trackId of Array.from(selectedTrackIds)) {
      // Doble verificación para asegurar que la canción no esté ya en la playlist
      if (currentTracks.some(t => t.id === trackId)) {
        console.log(`Canción ${trackId} ya está en la playlist. Saltando adición.`);
        continue;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}/tracks/${trackId}`, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
        });
        if (response.ok) {
          addedCount++;
        } else {
          const errorText = await response.text();
          console.error(`Error al añadir canción ${trackId}: Status: ${response.status}, Body: ${errorText}`);
          errorCount++;
        }
      } catch (error: any) {
        console.error(`Error de conexión al añadir canción ${trackId}:`, error.message, error.stack);
        errorCount++;
      }
    }

    setIsAddingTracks(false);
    onOpenChange(false); // Cierra el diálogo
    onPlaylistUpdated(); // Recarga la playlist en la página de detalles

    if (addedCount > 0) {
      toast.success(`${addedCount} canción${addedCount === 1 ? '' : 'es'} añadida${addedCount === 1 ? '' : 's'} a la playlist.`, {
        description: "Las pistas se han añadido exitosamente.",
        duration: 3000,
      });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} error${errorCount === 1 ? '' : 'es'} al añadir canciones.`, {
        description: "Algunas canciones no pudieron ser añadidas.",
        duration: 3000,
      });
    }
  };

  // Filtra las canciones disponibles que NO están ya en la playlist actual y que coinciden con el término de búsqueda
  const filteredTracks = availableTracks.filter((track) =>
    !currentTracks.some(t => t.id === track.id) && // Excluye las canciones que ya están en la playlist
    (track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.album.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const TrackListItem = ({ track }: { track: Track }) => {
    const isSelectedForNewAdd = selectedTrackIds.has(track.id);
    const alreadyInPlaylist = currentTracks.some(t => t.id === track.id);

    const defaultPlaceholderUrl = "https://placehold.co/64x64/E0E0E0/A0A0A0?text=No+Cover";
    let imageUrl: string;

    if (typeof track.artwork_url === 'string' && track.artwork_url.trim() !== '') {
      if (track.artwork_url.startsWith('/') || track.artwork_url.startsWith('http://') || track.artwork_url.startsWith('https://')) {
        imageUrl = track.artwork_url;
      } else {
        imageUrl = `/cover_art/${track.artwork_url}`;
      }
    } else {
      imageUrl = defaultPlaceholderUrl;
    }

    return (
      <div
        key={track.id}
        // ✅ Deshabilita el clic si la canción ya está en la playlist
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-colors",
          alreadyInPlaylist ? "opacity-60 cursor-not-allowed bg-neutral-50" : "cursor-pointer hover:bg-neutral-100",
          isSelectedForNewAdd && "bg-blue-100/70"
        )}
        onClick={() => {
          if (!alreadyInPlaylist) { // Solo permite la selección si no está ya en la playlist
            handleToggleSelect(track.id);
          }
        }}
      >
        <div className="flex-shrink-0 relative size-12 rounded-md overflow-hidden bg-neutral-200">
          <Image
            src={imageUrl}
            alt={`Carátula de ${track.title}`}
            fill
            sizes="48px"
            className="object-cover"
            onError={(e) => {
              console.error("Image failed to load in dialog:", imageUrl);
              (e.target as HTMLImageElement).src = defaultPlaceholderUrl;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{track.title}</div>
          <div className="text-sm text-neutral-500 truncate">{track.artist} - {track.album}</div>
        </div>
        <div className="flex-shrink-0">
          {alreadyInPlaylist ? (
            <Check className="size-5 text-green-600" /> // Icono de check si ya está en la playlist
          ) : (
            <div className={cn(
              "size-5 rounded-full border border-neutral-400 flex items-center justify-center",
              isSelectedForNewAdd && "bg-blue-500 border-blue-500" // Círculo azul si está seleccionada
            )}>
              {isSelectedForNewAdd && <Check className="size-4 text-white" />}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Añadir canciones a la playlist</DialogTitle>
          <DialogDescription>
            Busca y selecciona las canciones que quieres añadir a esta playlist.
          </DialogDescription>
        </DialogHeader>
        <div className="relative mt-4 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-neutral-500" />
          <Input
            placeholder="Buscar canciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-md w-full"
          />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          {isLoadingTracks ? (
            <div className="text-center text-neutral-500 py-4">Cargando canciones...</div>
          ) : filteredTracks.length === 0 && searchTerm !== "" ? ( // No hay resultados para la búsqueda
            <div className="text-center text-neutral-500 py-4">No se encontraron canciones que coincidan con la búsqueda.</div>
          ) : filteredTracks.length === 0 && availableTracks.length > 0 && searchTerm === "" ? ( // Todas ya están en la playlist
            <div className="text-center text-neutral-500 py-4">Todas las canciones ya están en esta playlist.</div>
          ) : filteredTracks.length === 0 && availableTracks.length === 0 && searchTerm === "" ? ( // No hay canciones en total
            <div className="text-center text-neutral-500 py-4">No hay canciones disponibles para añadir.</div>
          ) : (
            <div className="space-y-2">
              {filteredTracks.map((track) => (
                <TrackListItem key={track.id} track={track} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleAddSelectedTracks}
            disabled={selectedTrackIds.size === 0 || isAddingTracks}
          >
            {isAddingTracks ? "Añadiendo..." : `Añadir (${selectedTrackIds.size}) canción${selectedTrackIds.size === 1 ? '' : 'es'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
