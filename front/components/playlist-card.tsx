"use client"

import Image from "next/image"
import { motion } from "framer-motion"

type Props = {
  title?: string
  coverUrl?: string // Esto puede ser /ruta/a/img.png (de FastAPI o estático) o http://full.url
  count?: number
}

export function PlaylistCard({
  title = "Nueva Playlist",
  coverUrl, 
  count = 0,
}: Props) {
  // Define una URL de placeholder por defecto que siempre es válida
  const defaultPlaceholderUrl = `https://placehold.co/64x64/E0E0E0/A0A0A0?text=Playlist`;
  
  let finalCoverSource: string;

  // ✅ LÓGICA DE URL SIMPLIFICADA Y ROBUSTA:
  if (typeof coverUrl === 'string' && coverUrl.trim() !== '') {
    // Si la URL ya empieza con http:// o https:// (es una URL completa)
    // O si empieza con '/' (como /cover_art/filename.jpg, que Next.js sirve desde /public)
    if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://') || coverUrl.startsWith('/')) {
      finalCoverSource = coverUrl;
    } 
    // Si es solo un nombre de archivo (ej., "mi_portada.jpg"), asumimos que está en public/cover_art
    else {
      finalCoverSource = `/cover_art/${coverUrl}`;
    }
  } else {
    // Si coverUrl es nulo, indefinido o una cadena vacía, usa el placeholder por defecto
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
          // Manejo de errores en caso de que la imagen no cargue
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