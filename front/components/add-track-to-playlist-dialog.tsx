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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : '192.168.0.107'}:8000`;
      const response = await fetch(`${apiBaseUrl}/api/tracks`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching tracks: Status: ${response.status}, Body: ${errorText}`);
        throw new Error("Failed to fetch available tracks.");
      }
      const data: Track[] = await response.json();
      setAvailableTracks(data);
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
      if (!currentTracks.some(t => t.id === trackId)) {
        if (newSelected.has(trackId)) {
          newSelected.delete(trackId);
        } else {
          newSelected.add(trackId);
        }
      }
      return newSelected;
    });
  };

  const handleAddSelectedTracks = async () => {
    setIsAddingTracks(true);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${typeof window !== 'undefined' ? window.location.hostname : '192.168.0.107'}:8000`;
    let addedCount = 0;
    let errorCount = 0;

    for (const trackId of Array.from(selectedTrackIds)) {
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
    onOpenChange(false);
    onPlaylistUpdated();

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

  const filteredTracks = availableTracks.filter((track) =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.album.toLowerCase().includes(searchTerm.toLowerCase())
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
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg transition-colors",
          alreadyInPlaylist ? "opacity-60 cursor-not-allowed bg-neutral-50" : "cursor-pointer hover:bg-neutral-100",
          isSelectedForNewAdd && "bg-blue-100/70"
        )}
        onClick={() => handleToggleSelect(track.id)}
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
            <Check className="size-5 text-green-600" />
          ) : (
            <div className={cn(
              "size-5 rounded-full border border-neutral-400 flex items-center justify-center",
              isSelectedForNewAdd && "bg-blue-500 border-blue-500"
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
          ) : filteredTracks.length === 0 ? (
            <div className="text-center text-neutral-500 py-4">No se encontraron canciones.</div>
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
            {isAddingTracks ? "Añadiendo..." : `Añadir (${selectedTrackIds.size}) canciones`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}