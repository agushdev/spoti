"use client";

import React, { useState } from "react";
import { usePlayer } from "@/components/player/player-provider";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Heart, Play, Pause, Trash2, MoreHorizontal, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { DraggableAttributes } from "@dnd-kit/core";
import { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  added_at: string;
  audio_url: string;
};

type TrackRowProps = {
  track: Track;
  index: number;
  queue: Track[];
  onRemoveFromPlaylist?: (trackId: number) => void;
  attributes?: DraggableAttributes;
  dragHandleListeners?: SyntheticListenerMap;
  isDragging?: boolean;
  isOverlay?: boolean;
  isMobile: boolean;
  isReordering: boolean;
};

export function TrackRow({
  track,
  index,
  queue,
  onRemoveFromPlaylist,
  attributes,
  dragHandleListeners,
  isDragging = false,
  isOverlay = false,
  isMobile,
  isReordering,
}: TrackRowProps) {
  const { current, isPlaying, play, toggle, liked, toggleLike } = usePlayer();
  const isCurrentPlaying = current?.id === track.id && isPlaying;
  const isCurrentTrack = current?.id === track.id;

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack) {
      toggle();
    } else {
      play(track, queue);
    }
  };

  return (
    <div
      className={cn(
        "group grid items-center py-2 px-3 rounded-md transition-colors text-sm",
        isMobile ? "grid-cols-[auto_1fr_auto]" : "md:grid-cols-[20px_4fr_2fr_1fr_1fr_auto] md:gap-x-4",
        isCurrentTrack ? "bg-neutral-100 font-medium" : "hover:bg-neutral-100",
        isDragging && "opacity-0",
        isOverlay && "bg-white shadow-lg border border-neutral-200 opacity-95"
      )}
      onClick={isReordering ? undefined : handlePlayToggle}
    >
      {/* Columna izquierda: Número o Play/Pause */}
      <div className="flex items-center justify-center size-8 md:size-10 flex-shrink-0 text-neutral-500 relative">
        {/* Lógica corregida */}
        {!isReordering && (
          <>
            <span className={cn(
              "transition-opacity",
              isCurrentPlaying || (!isMobile && isCurrentTrack) ? "opacity-0" : "opacity-100",
              !isMobile && "group-hover:opacity-0"
            )}>
              {index + 1}
            </span>
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              isCurrentPlaying ? "opacity-100" : "opacity-0",
              !isMobile && "group-hover:opacity-100"
            )}>
              {isCurrentPlaying ? (
                <Pause className="size-4 text-neutral-700" />
              ) : (
                <Play className="size-4 text-neutral-700" />
              )}
            </div>
          </>
        )}
        {isReordering && <span>{index + 1}</span>}
      </div>

      {/* Columna central: Artwork, Título y Artista */}
      <div className="flex items-center gap-3 min-w-0">
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

      {/* Columnas adicionales para desktop: Álbum y Duración */}
      {!isMobile && (
        <>
          <div className="truncate text-neutral-500">{track.album}</div>
          <div className="text-neutral-500 text-right">{track.duration}</div>
        </>
      )}

      {/* Columna derecha: Drag Handle (reordering) o Menú de tres puntitos (normal) */}
      <div className="flex items-center justify-center size-8 md:size-10">
        {isReordering ? (
          <div
            className="size-8 flex items-center justify-center"
            style={{ touchAction: isMobile ? 'none' : 'auto' }}
            {...attributes}
            {...dragHandleListeners}
            data-dnd-handle="true"
          >
            <GripVertical className="size-4 text-neutral-500 cursor-grab" />
          </div>
        ) : (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-7 p-0 flex items-center justify-center hover:bg-neutral-200 text-neutral-500 opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPopoverOpen(true);
                }}
                aria-label="Más opciones"
                data-no-drag="true"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 relative size-12 rounded-md overflow-hidden bg-neutral-200">
                    <Image
                      src={imageUrl}
                      alt={`Carátula de ${track.title}`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="font-medium truncate">{track.title}</div>
                    <div className="text-sm text-neutral-500 truncate">{track.artist}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                    onClick={() => {
                      toggleLike(String(track.id));
                      setIsPopoverOpen(false);
                    }}
                  >
                    <Heart className={cn("size-4 mr-2", liked.has(String(track.id)) ? "text-red-500 fill-current" : "text-neutral-500")} />
                    {liked.has(String(track.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
                  </Button>
                  {onRemoveFromPlaylist && (
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-left hover:bg-neutral-100"
                      onClick={() => {
                        onRemoveFromPlaylist(track.id);
                        setIsPopoverOpen(false);
                      }}
                    >
                      <Trash2 className="size-4 mr-2 text-red-500" />
                      Eliminar de esta playlist
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}