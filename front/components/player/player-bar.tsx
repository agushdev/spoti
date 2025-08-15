"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayer } from "./player-provider";
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import Image from "next/image";

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export function PlayerBar() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    progress,
    duration,
    togglePlayerExpansion,
  } = usePlayer();

  const defaultPlayerCoverUrl = "https://placehold.co/64x64/E0E0E0/A0A0A0?text=No+Cover";
  let playerCoverSource: string;

  if (current && typeof current.artwork_url === 'string' && current.artwork_url.trim() !== '') {
    if (current.artwork_url.startsWith('/') || current.artwork_url.startsWith('http://') || current.artwork_url.startsWith('https://')) {
      playerCoverSource = current.artwork_url;
    } else {
      playerCoverSource = `/cover_art/${current.artwork_url}`;
    }
  } else {
    playerCoverSource = defaultPlayerCoverUrl;
  }

  if (!current) {
    return null;
  }

  return (
    <div
      className="flex items-center gap-3 px-2 py-2 md:py-3 cursor-pointer bg-white border-t border-neutral-200"
      onClick={togglePlayerExpansion}
    >
      <div className="size-12 md:size-14 overflow-hidden rounded-xl bg-neutral-100 flex-shrink-0">
        <Image
          src={playerCoverSource}
          width={64}
          height={64}
          alt={`Carátula de ${current?.album || "Desconocido"}`}
          className="object-cover"
          onError={(e) => {
            console.error("PlayerBar image failed to load:", playerCoverSource);
            (e.target as HTMLImageElement).src = defaultPlayerCoverUrl;
          }}
        />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden relative h-10">
        <div className="absolute whitespace-nowrap will-change-transform animate-marquee text-sm md:text-base font-medium">
          {current?.title || "Nada reproduciéndose"} - {current?.artist || "Artista desconocido"}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-neutral-100"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Anterior"
        >
          <SkipBack className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-neutral-100 border border-black/10 flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          aria-label={isPlaying ? "Pausar" : "Reproducir"}
        >
          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-neutral-100"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Siguiente"
        >
          <SkipForward className="size-5" />
        </Button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-200">
        <div
          className="h-full bg-black"
          style={{ width: `${(progress / duration) * 100}%` }}
        />
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          10% { transform: translateX(0%); }
          90% { transform: translateX(calc(-100% + 100px)); }
          100% { transform: translateX(0%); }
        }

        @media (max-width: 767px) {
          .animate-marquee {
            animation: marquee 15s linear infinite;
            white-space: nowrap;
          }
        }
        @media (min-width: 768px) {
          .animate-marquee {
            animation: marquee 20s linear infinite;
            white-space: nowrap;
          }
        }
      `}</style>
    </div>
  );
}