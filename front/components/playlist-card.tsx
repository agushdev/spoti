"use client"

import Image from "next/image"
import { motion } from "framer-motion"

type Props = {
  title?: string
  coverUrl?: string 
  count?: number
}

export function PlaylistCard({
  title = "Nueva Playlist",
  coverUrl, 
  count = 0,
}: Props) {
  const defaultPlaceholderUrl = `https://placehold.co/64x64/E0E0E0/A0A0A0?text=Playlist`;
  
  let finalCoverSource: string;

  if (typeof coverUrl === 'string' && coverUrl.trim() !== '') {
    if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://') || coverUrl.startsWith('/')) {
      finalCoverSource = coverUrl;
    } 
    else {
      finalCoverSource = `/cover_art/${coverUrl}`;
    }
  } else {
    finalCoverSource = defaultPlaceholderUrl;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl overflow-hidden border border-black/10">
      <div className="relative aspect-square">
        <Image 
          src={finalCoverSource} 
          alt={`Portada de ${title}`} 
          fill 
          className="object-cover" 
          
          onError={(e) => {
            console.error("PlaylistCard image failed to load:", finalCoverSource);
            (e.target as HTMLImageElement).src = defaultPlaceholderUrl; 
          }}
        />
      </div>
      <div className="p-3">
        <div className="font-medium truncate">{title}</div>
        <div className="text-sm text-neutral-500">{count} pistas</div>
      </div>
    </motion.div>
  )
}