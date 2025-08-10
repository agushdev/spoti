"use client";

import React from "react";
import { usePlayer } from "@/components/player/player-provider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Heart, Play, Pause, Trash2 } from "lucide-react"; // Se elimina GripVertical
import { Button } from "@/components/ui/button";

// Importaciones para @dnd-kit
import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";


type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string; // Formato "MM:SS"
  artwork_url: string | null;
  audio_url: string;
};

type TrackRowProps = {
  track: Track;
  index: number; 
  queue: Track[];
  onRemoveFromPlaylist?: (trackId: number) => void;
  // ✅ Props de @dnd-kit: Ahora se pasan directamente al div de la fila
  attributes?: DraggableAttributes; // Para el elemento principal (tabindex, etc.)
  listeners?: SyntheticListenerMap; // ✅ Para el drag handle (toda la fila)
  isDragging?: boolean; // Estado de arrastre del elemento original
  isOverlay?: boolean; // Si es el elemento del DragOverlay (para el clon flotante)
};

export function TrackRow({ 
  track, 
  index, 
  queue, 
  onRemoveFromPlaylist, 
  attributes, 
  listeners, // ✅ Ahora recibimos 'listeners' directamente
  isDragging = false, 
  isOverlay = false 
}: TrackRowProps) {
  const { current, isPlaying, play, toggle, liked, toggleLike } = usePlayer(); 
  const isCurrentPlaying = current?.id === track.id && isPlaying;
  const isCurrentTrack = current?.id === track.id;

  const defaultPlaceholderUrl = "https://placehold.co/48x48/E0E0E0/A0A0A0?text=No+Cover";
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
      className={cn(
        "group grid grid-cols-[auto_1fr_120px_60px_auto] md:grid-cols-[auto_3fr_2fr_120px_auto] items-center py-2 px-3 rounded-md transition-colors text-sm",
        isCurrentTrack ? "bg-neutral-100 font-medium" : "hover:bg-neutral-100", 
        isDragging && "opacity-0", // La fila original se vuelve completamente INVISIBLE cuando se arrastra
        isOverlay && "bg-white shadow-lg border border-neutral-200 opacity-95" // Estilos para el clon flotante
      )}
      // ✅ Aplicamos los atributos y listeners de DND al div principal
      {...attributes} 
      {...listeners} 
      // Cursor para la fila arrastrable (grab para arrastrable, grabbing cuando se arrastra o es overlay)
      style={{ cursor: (isDragging || isOverlay) ? 'grabbing' : 'grab' }} 
    >
      {/* Columna # / Play Button */}
      <div 
        className={cn(
          "flex items-center justify-center size-8 md:size-10 flex-shrink-0 text-neutral-500 relative transition-opacity"
        )}
      >
        {/* Número de pista por defecto, oculto en hover o si la canción está activa */}
        <span className={cn(
          "transition-opacity",
          (isCurrentTrack && isPlaying) ? "opacity-0" : "group-hover:opacity-0" 
        )}>
          {index + 1}
        </span>
        
        {/* Icono de Play/Pausa que aparece en hover o si es la canción actual */}
        {/* Este botón ahora tiene su propio onClick y detiene la propagación */}
        {/* ✅ Añadimos data-dndkit-disabled para que NO sea arrastrable desde aquí */}
        <div
            className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity",
                (isCurrentTrack && isPlaying) ? "opacity-100" : "opacity-0 group-hover:opacity-100" 
            )}
        >
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-6 p-0 flex items-center justify-center bg-white/80 hover:bg-white"
                onClick={(e) => {
                    e.stopPropagation(); // Detener propagación para NO iniciar arrastre en la fila
                    e.preventDefault(); // Prevenir comportamiento por defecto del clic
                    if (isCurrentTrack) {
                        toggle(); 
                    } else {
                        play(track, queue); 
                    }
                }}
                aria-label={isCurrentPlaying ? "Pausar" : "Reproducir"}
                data-dndkit-disabled="true" // ✅ Evita que @dnd-kit inicie un arrastre desde este botón
            >
                {isCurrentPlaying ? (
                    <Pause className="size-4 text-neutral-700" />
                ) : (
                    <Play className="size-4 text-neutral-700" />
                )}
            </Button>
        </div>
      </div>

      {/* Columna Título y Artista */}
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <div className="flex-shrink-0 relative size-10 rounded-md overflow-hidden bg-neutral-200">
          <Image
            src={imageUrl}
            alt={`Carátula de ${track.title}`}
            fill
            sizes="40px"
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultPlaceholderUrl;
            }}
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className={cn("truncate", isCurrentTrack && "text-blue-600")}>{track.title}</div>
          <div className="text-xs text-neutral-500 truncate">{track.artist}</div>
        </div>
      </div>

      {/* Columna Álbum (oculta en pantallas pequeñas) */}
      <div className="hidden md:block text-neutral-600 truncate pr-4">
        {track.album}
      </div>

      {/* Columna Duración */}
      <div className="text-neutral-500 text-right pr-4">
        {track.duration}
      </div>
      
      {/* Botones de Acción (Me Gusta y Eliminar) */}
      <div className="flex items-center justify-end gap-1 flex-shrink-0 w-16 md:w-20"> 
        {/* Botón Me Gusta */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "rounded-full size-7 p-0 flex items-center justify-center hover:bg-neutral-200", 
            liked.has(String(track.id)) ? "text-red-500 opacity-100" : "text-neutral-500 opacity-0 group-hover:opacity-100" 
          )}
          onClick={(e) => {
            e.stopPropagation(); // Detener propagación para NO iniciar arrastre en la fila
            e.preventDefault(); // Prevenir comportamiento por defecto
            toggleLike(String(track.id));
          }}
          aria-label={liked.has(String(track.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
          data-dndkit-disabled="true" // ✅ Evita que @dnd-kit inicie un arrastre desde este botón
        >
          <Heart className={cn("size-4", liked.has(String(track.id)) && "fill-current")} />
        </Button>
        
        {/* Botón Eliminar de Playlist (solo si la prop existe y aparece en hover) */}
        {onRemoveFromPlaylist && (
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full size-7 p-0 flex items-center justify-center hover:bg-neutral-200 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" 
            onClick={(e) => {
              e.stopPropagation(); // Detener propagación para NO iniciar arrastre en la fila
              e.preventDefault(); // Prevenir comportamiento por defecto
              onRemoveFromPlaylist(track.id);
            }}
            aria-label="Eliminar de playlist"
            data-dndkit-disabled="true" // ✅ Evita que @dnd-kit inicie un arrastre desde este botón
          >
            <Trash2 className="size-4 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}