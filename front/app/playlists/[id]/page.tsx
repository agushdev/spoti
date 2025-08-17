"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrackRow } from "@/components/track-row";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Plus, Edit, Trash2, PlayCircle, Shuffle, MoreHorizontal, Search, PauseCircle, GripVertical, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddTrackToPlaylistDialog } from '@/components/add-track-to-playlist-dialog';
import { EditPlaylistNameDialog } from '@/components/edit-playlist-name-dialog';
import { DeletePlaylistDialog } from '@/components/delete-playlist-dialog';
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePlayer } from "@/components/player/player-provider";
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  KeyboardSensor,
  closestCorners,
  UniqueIdentifier,
  DragMoveEvent,
  PointerSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableTrack } from '@/components/sortable-track';
import { toast } from 'sonner';
import { EditPlaylistImageDialog } from '@/components/edit-playlist-image-dialog';
// Ya no necesitamos importar React solo para React.use si no lo usas para otra cosa aquí.

// Tipos de datos (asegúrate de que coincidan con tu backend)
type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string; // Formato "MM:SS"
  artwork_url: string | null;
  added_at: string; // Por ejemplo, un timestamp ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
  audio_url: string;
};

type Playlist = {
  id: number;
  name: string;
  tracks: Track[];
  artwork_url?: string | null;
};

// Función de utilidad para formatear la duración
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours} hr ${formattedMinutes} min`;
  }
  return `${formattedMinutes}:${formattedSeconds}`;
}

// Función de utilidad para parsear la duración de "MM:SS" a segundos
function parseDuration(durationStr: string): number {
  if (!durationStr || typeof durationStr !== 'string') {
    console.warn("Invalid duration string:", durationStr);
    return 0;
  }
  const parts = durationStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  }
  console.error(`Formato de duración inesperado: ${durationStr}. Esperado "MM:SS" o "HH:MM:SS".`);
  return 0;
}

interface PlaylistDetailPageProps {
  params: { id: string };
}

export default function PlaylistDetailPage({ params }: PlaylistDetailPageProps) {
  const router = useRouter();
  const { play, shuffleMode, toggleShuffle, current: currentTrack, isPlaying, toggle: pause } = usePlayer();

  // ✅ SOLUCIÓN CORREGIDA PARA PARAMS:
  // params.id ya es una string, simplemente la parseamos y memoizamos.
  // No necesitamos React.use() aquí.
  const playlistId = useMemo(() => {
    return parseInt(params.id, 10);
  }, [params.id]); // params.id es la única dependencia

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState(false);
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditImageDialogOpen, setIsEditImageDialogOpen] = useState(false);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [initialPlaylistTracks, setInitialPlaylistTracks] = useState<Track[] | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 15,
      },
      onActivation: ({ event }) => {
        if (!(event.target instanceof Element) || !event.target.closest('[data-dnd-handle]')) {
          event.cancelable && event.preventDefault();
        }
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const modifiers = useMemo(() => [restrictToVerticalAxis], []);

  useEffect(() => {
    let scrollInterval: NodeJS.Timeout | null = null;
    const SCROLL_SPEED = 10;

    if (scrollDirection && containerRef.current) {
      scrollInterval = setInterval(() => {
        if (containerRef.current) {
          if (scrollDirection === 'up') {
            containerRef.current.scrollTop -= SCROLL_SPEED;
          } else if (scrollDirection === 'down') {
            containerRef.current.scrollTop += SCROLL_SPEED;
          }
        }
      }, 20);
    }

    return () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, [scrollDirection]);

  const fetchPlaylistDetails = useCallback(async () => {
    if (isNaN(playlistId)) {
      console.error("ID de Playlist inválido:", playlistId);
      setIsLoading(false);
      setPlaylist(null);
      return;
    }

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000`;
      const response = await fetch(`${apiBaseUrl}/api/playlists/${playlistId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error HTTP! Estado: ${response.status}, Cuerpo: ${errorText}`);
        setPlaylist(null);
        toast.error("Error al cargar playlist", { description: `No se pudo cargar la playlist. Estado: ${response.status}.` });
      } else {
        const data: Playlist = await response.json();
        let sortedTracks = [...data.tracks]; // Copia para no mutar el original

        // ✅ LÓGICA DE ORDENAMIENTO PARA NUEVAS CANCIONES:
        // Si NO estamos reordenando, ordena por fecha de adición.
        // Esto asegura que las nuevas canciones (con added_at más reciente) vayan al final.
        if (!isReordering) {
          sortedTracks.sort((a, b) => {
            // Convertir las cadenas de fecha a objetos Date para una comparación fiable
            const dateA = new Date(a.added_at).getTime();
            const dateB = new Date(b.added_at).getTime();
            return dateA - dateB; // Orden ascendente por fecha
          });
        }
        // Si isReordering es true, se respeta el orden actual de `data.tracks`
        // (que debería ser el orden arrastrado guardado en el backend o el último conocido)

        setPlaylist({ ...data, tracks: sortedTracks });
        setInitialPlaylistTracks(sortedTracks); // Guarda el orden inicial para "Cancelar"
      }
    } catch (error) {
      console.error("Error al obtener detalles de la playlist:", error);
      setPlaylist(null);
      toast.error("Error de conexión", { description: "No se pudo conectar con el servidor de música." });
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, isReordering]); // Dependencias

  useEffect(() => {
    if (!isNaN(playlistId)) {
      fetchPlaylistDetails();
    }
  }, [fetchPlaylistDetails, playlistId]);

  const handleUpdateArtworkUrl = useCallback(async (newImageUrl: string | null) => {
    if (!playlist) return;

    try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000`;
        const response = await fetch(`${apiBaseUrl}/api/playlists/${playlist.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ artwork_url: newImageUrl }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error al actualizar carátula: Status: ${response.status}, Body: ${errorText}`);
            throw new Error(`Error al actualizar carátula: ${errorText}`);
        } else {
            toast.success("Carátula de playlist actualizada.");
            fetchPlaylistDetails();
        }
    } catch (error: any) {
        console.error("Error de conexión al actualizar carátula:", error);
        toast.error("Error de red", { description: error.message || "No se pudo conectar con el servidor para actualizar la imagen." });
    }
  }, [playlist, fetchPlaylistDetails]);

  const handleRemoveTrack = useCallback(async (trackToRemoveId: number) => {
    if (!playlist) return;
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000`;
      const response = await fetch(`${apiBaseUrl}/api/playlists/${playlist.id}/tracks/${trackToRemoveId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al eliminar pista: Estado: ${response.status}, Cuerpo: ${errorText}`);
        toast.error("Hubo un error al eliminar la canción de la playlist.");
      } else {
        toast.success("Canción eliminada de la playlist.");
        fetchPlaylistDetails();
      }
    } catch (error) {
      console.error("Error al eliminar pista:", error);
      toast.error("Hubo un error al eliminar la canción.");
    }
  }, [playlist, fetchPlaylistDetails]);

  const handleDeletePlaylist = useCallback(async () => {
    if (!playlist) return;
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000`;
      const response = await fetch(`${apiBaseUrl}/api/playlists/${playlist.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al eliminar playlist: Estado: ${response.status}, Cuerpo: ${errorText}`);
        toast.error("Hubo un error al eliminar la playlist.");
      } else {
        toast.success("Playlist eliminada exitosamente.");
        router.push('/library');
      }
    } catch (error) {
      console.error("Error al eliminar playlist:", error);
      toast.error("Hubo un error al eliminar la playlist.");
    }
  }, [playlist, router]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!containerRef.current || !event.active.rect.current.translated) {
      setScrollDirection(null);
      return;
    }

    const { clientHeight, scrollTop } = containerRef.current;
    const scrollThreshold = 50;
    const pointerY = event.active.rect.current.translated.top - containerRef.current.getBoundingClientRect().top + scrollTop;

    if (pointerY < scrollThreshold) {
      setScrollDirection('up');
    } else if (pointerY > clientHeight - scrollThreshold) {
      setScrollDirection('down');
    } else {
      setScrollDirection(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setScrollDirection(null);
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id && playlist) {
      const oldIndex = playlist.tracks.findIndex(track => String(track.id) === String(active.id));
      const newIndex = playlist.tracks.findIndex(track => String(track.id) === String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTracks = arrayMove(playlist.tracks, oldIndex, newIndex);
        setPlaylist({ ...playlist, tracks: newTracks });
      }
    }
  };

  const handleReorderSave = useCallback(async () => {
    if (!playlist) return;
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || `http://${host}:8000`;
      const response = await fetch(`${apiBaseUrl}/api/playlists/${playlist.id}/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trackIds: playlist.tracks.map(t => t.id) }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al guardar el nuevo orden: Estado: ${response.status}, Cuerpo: ${errorText}`);
        toast.error("Hubo un error al guardar el nuevo orden de la playlist.");
      } else {
        toast.success("Orden de la playlist actualizado.");
        setInitialPlaylistTracks(playlist.tracks);
        setIsReordering(false);
      }
    } catch (error) {
      console.error("Error al guardar el nuevo orden:", error);
      toast.error("Hubo un error al guardar el nuevo orden.");
    }
  }, [playlist]);

  const handleReorderCancel = useCallback(() => {
    if (initialPlaylistTracks && playlist) {
      setPlaylist({ ...playlist, tracks: initialPlaylistTracks });
    }
    setIsReordering(false);
  }, [initialPlaylistTracks, playlist]);

  const trackIds = useMemo(() => playlist?.tracks.map(t => String(t.id)) || [], [playlist]);

  const activeTrack = useMemo(() => {
    if (!activeId || !playlist) return null;
    return playlist.tracks.find(t => String(t.id) === String(activeId));
  }, [activeId, playlist]);

  const filteredTracks = useMemo(() => {
    if (!playlist) return [];
    if (!searchQuery) return playlist.tracks;
    const lowerQuery = searchQuery.toLowerCase();
    return playlist.tracks.filter(track =>
      track.title.toLowerCase().includes(lowerQuery) ||
      track.artist.toLowerCase().includes(lowerQuery)
    );
  }, [playlist, searchQuery]);

  const totalDuration = useMemo(() => {
    if (!playlist) return 0;
    return playlist.tracks.reduce((sum, track) => sum + parseDuration(track.duration), 0);
  }, [playlist]);

  const totalDurationFormatted = formatDuration(totalDuration);

  const defaultPlaylistArtworkUrl = "https://placehold.co/200x200/cccccc/444444?text=Playlist";
  let playlistImage = playlist?.artwork_url || defaultPlaylistArtworkUrl;

  if (playlist?.artwork_url && !playlist.artwork_url.startsWith('http') && !playlist.artwork_url.startsWith('/')) {
    playlistImage = `/cover_art/${playlist.artwork_url}`;
  }

  const handlePlayPause = () => {
    if (!playlist || playlist.tracks.length === 0) return;
    const isFirstTrackPlaying = isPlaying && currentTrack?.id === playlist.tracks[0]?.id;
    if (isFirstTrackPlaying) {
      pause();
    } else {
      play(playlist.tracks[0], playlist.tracks);
    }
  };

  const isCurrentPlaylistPlaying = isPlaying && playlist?.tracks.some(track => track.id === currentTrack?.id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
        <p className="text-neutral-500">Cargando playlist...</p>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-10 text-center text-neutral-500 space-y-4">
        <p>Playlist no encontrada.</p>
        <Link href="/library" passHref>
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="size-4" /> Volver a Biblioteca
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {isMobile ? (
        <>
          <div className="flex items-center gap-2">
            <Link href="/library" passHref>
              <Button variant="ghost" className="p-0">
                <ChevronLeft className="size-6" />
              </Button>
            </Link>
            {isReordering && (
              <div className="flex-1 text-center font-bold">Cambiar orden</div>
            )}
          </div>

          {!isReordering && (
            <div className="relative">
              <Input
                placeholder="Buscar en la playlist"
                className="pl-10 bg-neutral-100 rounded-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-5 text-neutral-500" />
            </div>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="relative size-48 rounded-lg overflow-hidden bg-neutral-200 shadow-md flex-shrink-0 group">
              <Image
                src={playlistImage}
                alt={`Carátula de ${playlist.name}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  className="rounded-full size-10 bg-white/30 text-white hover:bg-white/50"
                  onClick={() => setIsEditImageDialogOpen(true)}
                  aria-label="Cambiar carátula de playlist"
                >
                  <ImageIcon className="size-5" />
                </Button>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">{playlist.name}</h1>
              <p className="text-neutral-600 mt-1">
                {playlist.tracks.length} canciones • {totalDurationFormatted}
              </p>
            </div>
          </div>

          {isReordering ? (
            <div className="flex items-center justify-center gap-4">
              <Button variant="ghost" className="text-neutral-500 font-bold" onClick={handleReorderCancel}>
                Cancelar
              </Button>
              <Button className="bg-black text-white rounded-full font-bold" onClick={handleReorderSave}>
                Guardar
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-10 p-0", shuffleMode && "text-black", "text-neutral-500 hover:text-black")}
                onClick={toggleShuffle}
              >
                <Shuffle className="size-6" />
              </Button>
              <Button
                className="bg-black text-white rounded-full size-14 p-0 flex items-center justify-center"
                onClick={handlePlayPause}
              >
                {isCurrentPlaylistPlaying ? <PauseCircle className="size-8" /> : <PlayCircle className="size-8" />}
              </Button>
              <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10 p-0 text-neutral-500 hover:text-black">
                    <MoreHorizontal className="size-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsReordering(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <GripVertical className="size-4 mr-2" />
                      Cambiar orden
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsAddTrackDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Plus className="size-4 mr-2" />
                      Añadir canciones
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsEditNameDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Edit className="size-4 mr-2" />
                      Editar playlist
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsEditImageDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <ImageIcon className="size-4 mr-2" />
                      Cambiar carátula
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100 text-red-500"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Trash2 className="size-4 mr-2 text-red-500" />
                      Eliminar playlist
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <Link href="/library" passHref>
              <Button variant="ghost" className="p-0">
                <ChevronLeft className="size-6" />
              </Button>
            </Link>
            {!isReordering && (
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Buscar en la playlist..."
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-md bg-neutral-100 focus:bg-neutral-50 border border-transparent focus:border-neutral-200 transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
            {isReordering && (
              <div className="flex-1 text-center font-bold text-xl">Cambiar orden</div>
            )}
          </div>

          <div className="flex flex-row gap-6">
            <div className="relative size-48 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-200 shadow-md group">
              <Image
                src={playlistImage}
                alt={`Carátula de ${playlist.name}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  className="rounded-full size-10 bg-white/30 text-white hover:bg-white/50"
                  onClick={() => setIsEditImageDialogOpen(true)}
                  aria-label="Cambiar carátula de playlist"
                >
                  <ImageIcon className="size-5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-col justify-end flex-1">
              <h1 className="text-4xl font-bold">{playlist.name}</h1>
              <p className="text-neutral-600 mt-2">
                {playlist.tracks.length} canciones • {totalDurationFormatted}
              </p>
            </div>
          </div>

          {isReordering ? (
            <div className="flex items-center justify-start gap-4">
              <Button variant="ghost" className="text-neutral-500 font-bold" onClick={handleReorderCancel}>
                Cancelar
              </Button>
              <Button className="bg-black text-white rounded-full font-bold" onClick={handleReorderSave}>
                Guardar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-10 p-0 text-neutral-500 hover:text-black", shuffleMode && "text-black")}
                onClick={toggleShuffle}
              >
                <Shuffle className="size-6" />
              </Button>
              <Button
                className="bg-black text-white rounded-full size-14 p-0 flex items-center justify-center"
                onClick={handlePlayPause}
              >
                {isCurrentPlaylistPlaying ? <PauseCircle className="size-8" /> : <PlayCircle className="size-8" />}
              </Button>
              <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-10 p-0 text-neutral-500 hover:text-black">
                    <MoreHorizontal className="size-6" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="end">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsReordering(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <GripVertical className="size-4 mr-2" />
                      Cambiar orden
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsAddTrackDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Plus className="size-4 mr-2" />
                      Añadir canciones
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsEditNameDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Edit className="size-4 mr-2" />
                      Editar playlist
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        setIsEditImageDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <ImageIcon className="size-4 mr-2" />
                      Cambiar carátula
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100 text-red-500"
                      onClick={() => {
                        setIsDeleteDialogOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <Trash2 className="size-4 mr-2 text-red-500" />
                      Eliminar playlist
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </>
      )}

      <div className="mt-4">
        <div
          className={cn(
            "grid items-center px-4 py-2 text-xs font-light text-neutral-500 border-b border-neutral-200",
            isMobile ? "grid-cols-[20px_1fr_auto]" : "md:grid-cols-[20px_4fr_2fr_1fr_1fr_auto] md:gap-x-4"
          )}
        >
          <span className="text-center">#</span>
          <span className="truncate">Título</span>
          {!isMobile && <span className="truncate">Álbum</span>}
          {!isMobile && <span className="truncate">Duración</span>}
          <span className="sr-only">Acciones</span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          modifiers={modifiers}
        >
          <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
            <div
              ref={containerRef}
              className="space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-400px)]"
            >
              {filteredTracks.length === 0 ? (
                <p className="text-neutral-500 col-span-full py-4 text-center">No se encontraron canciones.</p>
              ) : (
                filteredTracks.map((track, index) => (
                  <SortableTrack
                    key={String(track.id)}
                    id={String(track.id)}
                    track={track}
                    index={index}
                    queue={filteredTracks}
                    onRemoveFromPlaylist={handleRemoveTrack}
                    isMobile={isMobile}
                    isReordering={isReordering}
                  />
                ))
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTrack ? (
              <TrackRow
                track={activeTrack}
                index={filteredTracks.findIndex(t => t.id === activeTrack.id)}
                queue={[]}
                isOverlay={true}
                isMobile={isMobile}
                isReordering={isReordering}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <AddTrackToPlaylistDialog
        open={isAddTrackDialogOpen}
        onOpenChange={setIsAddTrackDialogOpen}
        playlistId={playlistId}
        currentTracks={playlist?.tracks || []}
        onPlaylistUpdated={fetchPlaylistDetails}
      />
      <EditPlaylistNameDialog
        open={isEditNameDialogOpen}
        onOpenChange={setIsEditNameDialogOpen}
        playlistId={playlistId}
        currentName={playlist?.name || ''}
        onPlaylistUpdated={fetchPlaylistDetails}
      />
      <DeletePlaylistDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        playlistId={playlistId}
        playlistName={playlist?.name || ''}
        onPlaylistDeleted={handleDeletePlaylist}
      />
      <EditPlaylistImageDialog
        open={isEditImageDialogOpen}
        onOpenChange={setIsEditImageDialogOpen}
        playlistId={playlistId}
        currentImageUrl={playlist?.artwork_url || null}
        onImageUpdated={fetchPlaylistDetails}
        onUpdateImageUrl={handleUpdateArtworkUrl}
      />
    </div>
  );
}