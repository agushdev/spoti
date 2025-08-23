"use client"

import { usePlayer } from "@/components/player/player-provider"
import { Button } from "@/components/ui/button"
import { Heart, Play, Trash2 } from 'lucide-react'
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  artwork_url: string | null;
  audio_url: string;
};

type Props = {
  track: Track;
  queue: Track[];
  onRemoveFromPlaylist?: (trackId: number) => void;
};

export function TrackCard({ track, queue = [], onRemoveFromPlaylist }: Props) {
  const { play, liked, toggleLike } = usePlayer();

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
    <motion.div
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="group relative cursor-pointer"
      onClick={() => play(track, queue)}
    >
      <div className="rounded-2xl overflow-hidden border border-black/10 bg-white">
        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={`Carátula de ${track.album || "Álbum desconocido"}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
            onError={(e) => {
              console.error("Image failed to load:", imageUrl);
              (e.target as HTMLImageElement).src = defaultPlaceholderUrl;
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          <div className="absolute right-3 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRemoveFromPlaylist && (
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFromPlaylist(track.id);
                }}
                aria-label="Eliminar de playlist"
              >
                <Trash2 className="size-5 text-red-500" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className={cn("rounded-full bg-white/90 hover:bg-white", liked.has(String(track.id)) && "text-black")}
              onClick={(e) => {
                e.stopPropagation();
                toggleLike(String(track.id));
              }}
              aria-label={liked.has(String(track.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
            >
              <Heart className={cn("size-5", liked.has(String(track.id)) && "fill-current")} />
            </Button>
          </div>
        </div>
        <div className="p-3">
          <div className="font-medium truncate">{track.title}</div>
          <div className="text-sm text-neutral-500 truncate">{track.artist}</div>
        </div>
      </div>
    </motion.div>
  );
}