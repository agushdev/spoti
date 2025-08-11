"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlayer } from "./player-provider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, Heart } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export function FullScreenPlayer() {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    progress,
    duration,
    seek,
    volume,
    setVolume,
    liked,
    toggleLike,
    shuffleMode,
    loopMode,
    toggleShuffle,
    toggleLoop,
    isPlayerExpanded, 
    togglePlayerExpansion, 
  } = usePlayer();

  const vol = Math.round(volume * 100);

  const defaultCover = "https://placehold.co/500x500/E0E0E0/A0A0A0?text=No+Cover";
  let playerCoverSource: string;

  if (current && typeof current.artwork_url === 'string' && current.artwork_url.trim() !== '') {
    if (current.artwork_url.startsWith('http://') || current.artwork_url.startsWith('https://')) {
      playerCoverSource = current.artwork_url;
    } 
    else if (current.artwork_url.startsWith('/')) {
      playerCoverSource = current.artwork_url;
    }
    else {
      playerCoverSource = `/cover_art/${current.artwork_url}`;
    }
  } else {
    playerCoverSource = defaultCover;
  }

  return (
    <Dialog open={isPlayerExpanded} onOpenChange={togglePlayerExpansion}>
      <DialogContent 
        className={cn(
          "fixed inset-0 w-screen h-screen p-0 m-0",
          "flex flex-col items-center",
          "bg-gradient-to-b from-neutral-100 to-neutral-200 text-black",
          "!translate-x-0 !translate-y-0 !top-0 !left-0 !max-w-none rounded-none border-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Reproductor a Pantalla Completa</DialogTitle>
        </VisuallyHidden>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerExpansion}
          className="absolute top-4 left-4 z-20 rounded-full text-neutral-700 hover:bg-neutral-300"
          aria-label="Cerrar reproductor"
        >
          <X className="size-6" />
        </Button>

        {/* Mobile Layout */}
        <div className="flex-1 flex flex-col items-center w-full px-4 pt-16 pb-8 gap-6 sm:hidden">
          {/* Cover Image */}
          <div className="relative w-full max-w-[calc(100vw-2rem)] aspect-square rounded-lg overflow-hidden shadow-lg">
            <Image
              src={playerCoverSource}
              alt={`Carátula de ${current?.album || "Desconocido"}`}
              fill
              sizes="100vw"
              className="object-cover"
              onError={(e) => {
                console.error("Full screen image failed to load:", playerCoverSource);
                (e.target as HTMLImageElement).src = defaultCover;
              }}
            />
          </div>

          {/* Track Info */}
          <div className="text-center w-full px-2">
            <h2 className="text-2xl font-bold truncate">{current?.title || "Nada reproduciéndose"}</h2>
            <p className="text-lg text-neutral-600 truncate">{current?.artist || "Selecciona una pista"}</p>
            <p className="text-sm text-neutral-500 truncate mt-1">{current?.album || "Álbum desconocido"}</p>
          </div>

          {/* Seek Bar */}
          <div className="w-full flex items-center gap-3 text-neutral-600">
            <span className="text-sm tabular-nums">{formatTime(progress)}</span>
            <Slider
              value={[Math.min(progress, duration || 0)]}
              max={Math.max(duration, 1)}
              step={1}
              onValueChange={(v) => seek(v[0] || 0)}
              className="flex-1 [&_span]:bg-black [&_div]:bg-black [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
            />
            <span className="text-sm tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0", shuffleMode && "text-green-500")}
              onClick={toggleShuffle}
              aria-label="Modo aleatorio"
            >
              <Shuffle className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 p-0"
              onClick={prev}
              aria-label="Anterior"
            >
              <SkipBack className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full border border-neutral-300 text-black size-12 p-0"
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 p-0"
              onClick={next}
              aria-label="Siguiente"
            >
              <SkipForward className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0", loopMode !== 'none' && "text-green-500")}
              onClick={toggleLoop}
              aria-label={`Modo de repetición: ${loopMode === 'none' ? 'Ninguno' : loopMode === 'all' ? 'Toda la lista' : 'Una canción'}`}
            >
              {loopMode === 'one' ? (
                <Repeat1 className="size-6" />
              ) : (
                <Repeat className="size-6" />
              )}
            </Button>
          </div>

          {/* Volume and Like */}
          <div className="flex items-center justify-between w-full max-w-md gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label={liked.has(String(current?.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
              onClick={() => current && toggleLike(String(current.id))}
              className={cn(
                "size-10 p-0",
                liked.has(String(current?.id)) && "text-red-500 fill-red-500"
              )}
            >
              <Heart className={cn("size-6", liked.has(String(current?.id)) && "fill-current")} />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="size-5 text-neutral-600" />
              <Slider
                value={[vol]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume((v[0] || 0) / 100)}
                className="flex-1 [&_span]:bg-black [&_div]:bg-black [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
              />
              <span className="text-sm text-neutral-600 tabular-nums w-8 text-right">{vol}</span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex flex-1 flex-col items-center w-full px-6 pt-20 pb-10 gap-8">
          {/* Cover Image */}
          <div className="relative w-full max-w-lg aspect-square rounded-lg overflow-hidden shadow-lg">
            <Image
              src={playerCoverSource}
              alt={`Carátula de ${current?.album || "Desconocido"}`}
              fill
              sizes="50vw"
              className="object-cover"
              onError={(e) => {
                console.error("Full screen image failed to load:", playerCoverSource);
                (e.target as HTMLImageElement).src = defaultCover;
              }}
            />
          </div>

          {/* Track Info */}
          <div className="text-center w-full px-2">
            <h2 className="text-3xl font-bold truncate">{current?.title || "Nada reproduciéndose"}</h2>
            <p className="text-xl text-neutral-600 truncate">{current?.artist || "Selecciona una pista"}</p>
            <p className="text-base text-neutral-500 truncate mt-1">{current?.album || "Álbum desconocido"}</p>
          </div>

          {/* Seek Bar */}
          <div className="w-full max-w-2xl flex items-center gap-3 text-neutral-600">
            <span className="text-sm tabular-nums">{formatTime(progress)}</span>
            <Slider
              value={[Math.min(progress, duration || 0)]}
              max={Math.max(duration, 1)}
              step={1}
              onValueChange={(v) => seek(v[0] || 0)}
              className="flex-1 [&_span]:bg-black [&_div]:bg-black [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
            />
            <span className="text-sm tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0", shuffleMode && "text-green-500")}
              onClick={toggleShuffle}
              aria-label="Modo aleatorio"
            >
              <Shuffle className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 p-0"
              onClick={prev}
              aria-label="Anterior"
            >
              <SkipBack className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full border border-neutral-300 text-black size-12 p-0"
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-10 p-0"
              onClick={next}
              aria-label="Siguiente"
            >
              <SkipForward className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0", loopMode !== 'none' && "text-green-500")}
              onClick={toggleLoop}
              aria-label={`Modo de repetición: ${loopMode === 'none' ? 'Ninguno' : loopMode === 'all' ? 'Toda la lista' : 'Una canción'}`}
            >
              {loopMode === 'one' ? (
                <Repeat1 className="size-6" />
              ) : (
                <Repeat className="size-6" />
              )}
            </Button>
          </div>

          {/* Volume and Like */}
          <div className="flex items-center justify-center gap-4 max-w-md w-full">
            <Button
              variant="ghost"
              size="icon"
              aria-label={liked.has(String(current?.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
              onClick={() => current && toggleLike(String(current.id))}
              className={cn(
                "size-10 p-0",
                liked.has(String(current?.id)) && "text-red-500 fill-red-500"
              )}
            >
              <Heart className={cn("size-6", liked.has(String(current?.id)) && "fill-current")} />
            </Button>
            <Volume2 className="size-5 text-neutral-600" />
            <Slider
              value={[vol]}
              max={100}
              step={1}
              onValueChange={(v) => setVolume((v[0] || 0) / 100)}
              className="flex-1 [&_span]:bg-black [&_div]:bg-black [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
            />
            <span className="text-sm text-neutral-600 tabular-nums w-8 text-right">{vol}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}