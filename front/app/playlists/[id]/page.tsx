"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrackRow } from "@/components/track-row"; 
import Link from "next/link";
import { ChevronLeft, Plus, Edit, Trash2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { AddTrackToPlaylistDialog } from '@/components/add-track-to-playlist-dialog'; 
import { EditPlaylistNameDialog } from '@/components/edit-playlist-name-dialog'; 
import { DeletePlaylistDialog } from '@/components/delete-playlist-dialog'; 

// Importaciones de @dnd-kit
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor, 
  useSensors, 
  PointerSensor as DndPointerSensor, // Renombrado para evitar conflicto con CustomPointerSensor
  KeyboardSensor,
  closestCorners,
  UniqueIdentifier
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy // ✅ Estrategia de ordenación vertical
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// Importaciones de modificadores para restringir movimiento
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

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

// Custom PointerSensor para ignorar arrastres que comienzan en elementos con data-dndkit-disabled="true"
class CustomPointerSensor extends DndPointerSensor { 
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }) => {
        // Ignora el arrastre si el clic se originó en un elemento con data-dndkit-disabled="true"
        if (event.target instanceof Element && event.target.closest('[data-dndkit-disabled="true"]')) {
          return false;
        }
        return true;
      },
    },
  ];
}

// Custom modifier para restringir el DragOverlay a los límites del contenedor
// Esto ayuda a que el elemento arrastrado no se vaya "demasiado lejos"
const restrictToContainer = (containerRef: React.RefObject<HTMLDivElement>) => {
  return ({ transform, activeNodeRect }: { transform: any; activeNodeRect: any }) => {
    if (!containerRef.current || !activeNodeRect) {
      return transform;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaY = transform.y;
    const proposedTop = activeNodeRect.top + deltaY;
    const proposedBottom = activeNodeRect.bottom + deltaY;
    let newDeltaY = deltaY;

    if (proposedTop < containerRect.top) {
      newDeltaY = containerRect.top - activeNodeRect.top;
    } else if (proposedBottom > containerRect.bottom) {
      newDeltaY = containerRect.bottom - activeNodeRect.bottom;
    }

    return { ...transform, y: newDeltaY };
  };
};


// Componente Wrapper para hacer TrackRow sortable, definido localmente aquí
function SortableTrack({
  id,
  track,
  index,
  queue,
  onRemoveFromPlaylist,
}: {
  id: UniqueIdentifier;
  track: Track;
  index: number;
  queue: Track[];
  onRemoveFromPlaylist: (trackId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // La fila original se vuelve completamente invisible al arrastrar
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TrackRow
        track={track}
        index={index}
        queue={queue}
        onRemoveFromPlaylist={onRemoveFromPlaylist}
        attributes={attributes} 
        listeners={listeners} // ✅ Aquí pasamos 'listeners' directamente
        isDragging={isDragging} 
      />
    </div>
  );
}


export default function PlaylistDetailPage({ params }: { params: { id: string } }) { 
  const router = useRouter();
  const playlistId = parseInt(params.id, 10); 
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState(false);
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null); // Para el DragOverlay

  const containerRef = useRef<HTMLDivElement>(null); // Referencia al contenedor de las canciones

  const sensors = useSensors(
    // ✅ Usamos CustomPointerSensor con una distancia de activación de 1px
    useSensor(CustomPointerSensor, { activationConstraint: { distance: 1 } }), 
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const modifiers = useMemo(
    () => [restrictToVerticalAxis, restrictToContainer(containerRef)], 
    [containerRef] 
  );

  const fetchPlaylistDetails = useCallback(async () => {
    if (isNaN(playlistId)) {
        console.error("ID de Playlist inválido:", params.id);
        setIsLoading(false);
        setPlaylist(null);
        return;
    }

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const response = await fetch(`http://${host}:8000/api/playlists/${playlistId}`);
      console.log("Obteniendo playlist de:", `http://${host}:8000/api/playlists/${playlistId}`); 
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error HTTP! Estado: ${response.status}, Cuerpo: ${errorText}`);
        setPlaylist(null); 
      } else {
        const data: Playlist = await response.json();
        console.log("Datos de la playlist:", data); 
        setPlaylist(data);
      }
    } catch (error) {
      console.error("Error al obtener detalles de la playlist:", error);
      setPlaylist(null); 
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, params.id]); 

  useEffect(() => {
    fetchPlaylistDetails();
  }, [fetchPlaylistDetails]);

  const handleRemoveTrack = useCallback(async (trackToRemoveId: number) => {
    if (!playlist) return;

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const response = await fetch(`http://${host}:8000/api/playlists/${playlist.id}/tracks/${trackToRemoveId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al eliminar pista: Estado: ${response.status}, Cuerpo: ${errorText}`);
        alert("Hubo un error al eliminar la canción de la playlist."); 
      } else {
        alert("Canción eliminada de la playlist."); 
        fetchPlaylistDetails(); 
      }
    } catch (error) {
      console.error("Error al eliminar pista:", error);
      alert("Hubo un error al eliminar la canción."); 
    }
  }, [playlist, fetchPlaylistDetails]);

  const handleDeletePlaylist = useCallback(async () => {
    if (!playlist) return;

    try {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const response = await fetch(`http://${host}:8000/api/playlists/${playlist.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error al eliminar playlist: Estado: ${response.status}, Cuerpo: ${errorText}`);
        alert("Hubo un error al eliminar la playlist."); 
      } else {
        alert("Playlist eliminada exitosamente."); 
        router.push('/biblioteca'); 
      }
    } catch (error) {
      console.error("Error al eliminar playlist:", error);
      alert("Hubo un error al eliminar la playlist."); 
    }
  }, [playlist, router]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null); 

    if (over && active.id !== over.id && playlist) {
      const oldIndex = playlist.tracks.findIndex(track => String(track.id) === String(active.id));
      const newIndex = playlist.tracks.findIndex(track => String(track.id) === String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTracks = arrayMove(playlist.tracks, oldIndex, newIndex);
        setPlaylist({ ...playlist, tracks: newTracks });

        // TODO: Llama a tu backend para PERSISTIR el nuevo orden aquí
        console.log("Nueva orden de tracks:", newTracks.map(t => t.id));
      }
    }
  };

  const trackIds = useMemo(() => playlist?.tracks.map(t => String(t.id)) || [], [playlist]);

  // Obtener la canción activa para el DragOverlay
  const activeTrack = useMemo(() => {
    if (!activeId || !playlist) return null;
    return playlist.tracks.find(t => String(t.id) === String(activeId));
  }, [activeId, playlist]);


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
        <Link href="/biblioteca" passHref>
          <Button variant="outline" className="flex items-center gap-2">
            <ChevronLeft className="size-4" /> Volver a Biblioteca
          </Button>
        </Link>
      </div>
    );
  }

  const tracksToRender = playlist.tracks;

  return (
    <div className="space-y-6">
      <Link href="/biblioteca" passHref>
        <Button variant="ghost" className="flex items-center gap-2">
          <ChevronLeft className="size-4" /> Volver a Biblioteca
        </Button>
      </Link>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          <p className="text-neutral-600">{tracksToRender.length} canciones</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:flex-nowrap md:justify-end">
          <Button onClick={() => setIsAddTrackDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="size-4" /> Añadir canciones
          </Button>
          <Button variant="outline" onClick={() => setIsEditNameDialogOpen(true)} className="flex items-center gap-2">
            <Edit className="size-4" /> Editar
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2">
            <Trash2 className="size-4" /> Eliminar Playlist
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {/* Cabecera visible solo en sm+ para ahorrar espacio en móvil */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_120px_60px_auto] gap-2 py-2 px-3 border-b border-neutral-200 text-xs font-semibold text-neutral-500 uppercase">
          <div className="text-center">#</div>
          <div>Título</div>
          <div className="hidden md:block">Álbum</div>
          <div className="text-right">Duración</div>
          <div className="text-right"></div>
        </div>

        {/* DndContext con modificadores para movimiento vertical y restricción de bordes */}
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}    
          modifiers={modifiers} 
        >
          {/* SortableContext para la lista de canciones ordenables */}
          <SortableContext items={trackIds} strategy={verticalListSortingStrategy}> 
            <div ref={containerRef} className="space-y-1 mt-2">
              {tracksToRender.length === 0 ? (
                <p className="text-neutral-500 col-span-full py-4 text-center">Aún no hay canciones en esta playlist.</p>
              ) : (
                tracksToRender.map((track, index) => ( 
                  <SortableTrack 
                    key={String(track.id)} 
                    id={String(track.id)}  
                    track={track}
                    index={index} 
                    queue={tracksToRender}
                    onRemoveFromPlaylist={handleRemoveTrack} 
                  />
                ))
              )}
            </div>
          </SortableContext>
          
          {/* DragOverlay para el "clon" flotante (estilo Spotify) */}
          <DragOverlay>
            {activeTrack ? (
              <TrackRow 
                track={activeTrack} 
                index={tracksToRender.findIndex(t => t.id === activeTrack.id)} 
                queue={[]} 
                isOverlay={true} // Indicar que es un overlay
              />
            ) : null}
          </DragOverlay>

        </DndContext>
      </div>

      <AddTrackToPlaylistDialog
        open={isAddTrackDialogOpen}
        onOpenChange={setIsAddTrackDialogOpen}
        playlistId={playlistId}
        currentTracks={tracksToRender}
        onPlaylistUpdated={fetchPlaylistDetails} 
      />

      <EditPlaylistNameDialog
        open={isEditNameDialogOpen}
        onOpenChange={setIsEditNameDialogOpen}
        playlistId={playlistId}
        currentName={playlist.name}
        onPlaylistUpdated={fetchPlaylistDetails} 
      />

      <DeletePlaylistDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        playlistId={playlistId}
        playlistName={playlist.name}
        onPlaylistDeleted={handleDeletePlaylist} 
      />
    </div>
  );
}