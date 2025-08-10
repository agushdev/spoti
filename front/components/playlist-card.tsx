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

  // Host seguro tanto en cliente como en servidor
  const host =
    typeof window !== "undefined"
      ? window.location.hostname
      : process.env.NEXT_PUBLIC_HOST ?? "192.168.0.107";

  function buildSafeUrl(input?: string): string {
    // Si es nulo, vacío o solo espacios → placeholder
    if (!input || !input.trim()) return defaultPlaceholderUrl;

    // Si empieza con http:// o https:// → validar con new URL
    if (input.startsWith("http://") || input.startsWith("https://")) {
      try {
        new URL(input); // Valida que sea URL real
        return input;
      } catch {
        return defaultPlaceholderUrl;
      }
    }

    // Si empieza con "/" → asumir que es del backend FastAPI
    if (input.startsWith("/")) {
      const apiUrl = `http://${host}:8000${input}`;
      try {
        new URL(apiUrl);
        return apiUrl;
      } catch {
        return defaultPlaceholderUrl;
      }
    }

    // Cualquier otro caso → placeholder
    return defaultPlaceholderUrl;
  }

  const finalCoverSource = buildSafeUrl(coverUrl);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl overflow-hidden border border-black/10"
    >
      <div className="relative aspect-square">
        <Image
          src={finalCoverSource}
          alt={`Portada de ${title}`}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = defaultPlaceholderUrl;
          }}
        />
      </div>
      <div className="p-3">
        <div className="font-medium truncate">{title}</div>
        <div className="text-sm text-neutral-500">{count} pistas</div>
      </div>
    </motion.div>
  );
}