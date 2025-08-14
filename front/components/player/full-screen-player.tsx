"use client";

import { Dialog as DialogRoot, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePlayer } from "./player-provider";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X, Shuffle, SkipBack, Play, Pause, SkipForward, Repeat, Repeat1, Volume2, Heart } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useEffect, useState, useRef, useCallback } from "react";

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

  // Define el estilo de fondo dinámico con la carátula del álbum
  const dialogBackgroundStyle = {
    backgroundImage: `url('${playerCoverSource}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  // Referencia al elemento de audio (asumo que PlayerProvider lo maneja globalmente)
  const audioRef = useRef<HTMLDudeAudioElement | null>(null); // Corregido tipo de referencia

  // Estos useEffects probablemente son manejados en player-provider.tsx.
  // Los mantengo aquí solo si FullScreenPlayer tuviera un audio independiente.
  // Si el audio principal es gestionado completamente por PlayerProvider, puedes eliminarlos.
  useEffect(() => {
    if (!current) return;
    const audio = audioRef.current;
    if (audio) {
      const audioUrl = current.audio_url.startsWith('/') || current.audio_url.startsWith('http')
        ? current.audio_url
        : `/audio/${current.audio_url}`;
      if (audio.src !== audioUrl) {
        audio.src = audioUrl;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(e => console.error("Error playing audio in FullScreenPlayer:", e));
      } else {
        audio.pause();
      }
    }
  }, [current, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(e => console.error("Error playing audio:", e));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioTime = () => seek(audio.currentTime);
    const setAudioDuration = () => { /* duration is managed by provider */ }; 
    const handleEnded = () => next();

    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("loadedmetadata", setAudioDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [seek, next]);

  return (
    <DialogRoot open={isPlayerExpanded} onOpenChange={togglePlayerExpansion}>
      <DialogContent 
        className={cn(
          "fixed inset-0 w-screen h-screen p-0 m-0",
          "flex flex-col items-center justify-between",
          "text-white", 
          "!translate-x-0 !translate-y-0 !top-0 !left-0 !max-w-none rounded-none border-none",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "full-screen-player-custom-dialog" // Clase única para este componente
        )}
        style={dialogBackgroundStyle} 
      >
        {/* Overlay para el efecto de desenfoque y opacidad */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl z-0"></div> 
        
        <VisuallyHidden>
          <DialogTitle>Reproductor a Pantalla Completa</DialogTitle>
        </VisuallyHidden>

        {/* ✅ Botón de Cerrar (personalizado, AHORA arriba a la DERECHA) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerExpansion}
          className="absolute top-4 right-4 z-20 rounded-full text-white hover:bg-white/20" // Posición cambiada a right-4
          aria-label="Cerrar reproductor"
        >
          <X className="size-6" />
        </Button>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center w-full relative z-10 px-4 pt-16 pb-8 sm:pt-20 sm:pb-10">
          {/* Cover Image */}
          <div className="relative w-full max-w-[calc(100vw-4rem)] sm:max-w-lg aspect-square rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={playerCoverSource}
              alt={`Carátula de ${current?.album || "Desconocido"}`}
              fill
              sizes="(max-width: 640px) 90vw, 500px"
              className="object-cover"
              onError={(e) => {
                console.error("Full screen image failed to load:", playerCoverSource);
                (e.target as HTMLImageElement).src = defaultCover;
              }}
            />
          </div>

          {/* Track Info */}
          <div className="text-center w-full px-2 mt-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold truncate text-white">{current?.title || "Nada reproduciéndose"}</h2>
            <p className="text-lg sm:text-2xl text-neutral-300 truncate mt-1">{current?.artist || "Selecciona una pista"}</p>
            <p className="text-sm sm:text-base text-neutral-400 truncate mt-1">{current?.album || "Álbum desconocido"}</p>
          </div>
        </div>

        {/* Controles del reproductor (bottom section) */}
        <div className="w-full flex-none flex flex-col gap-4 px-4 pb-8 md:px-6 md:pb-10 relative z-10">
          {/* Seek Bar */}
          <div className="w-full flex items-center gap-3 text-neutral-300">
            <span className="text-sm tabular-nums">{formatTime(progress)}</span>
            <Slider
              value={[Math.min(progress, duration || 0)]}
              max={Math.max(duration, 1)}
              step={1}
              onValueChange={(v) => seek(v[0] || 0)}
              className="flex-1 [&_span]:bg-white [&_div]:bg-neutral-700 [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
            />
            <span className="text-sm tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0 text-neutral-400 hover:text-white", shuffleMode && "text-white")}
              onClick={toggleShuffle}
              aria-label="Modo aleatorio"
            >
              <Shuffle className="size-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-14 p-0 text-white hover:bg-white/20"
              onClick={prev}
              aria-label="Anterior"
            >
              <SkipBack className="size-8" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full bg-white text-black size-20 p-0 flex items-center justify-center hover:bg-white/90 shadow-lg"
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="size-10" /> : <Play className="size-10" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-14 p-0 text-white hover:bg-white/20"
              onClick={next}
              aria-label="Siguiente"
            >
              <SkipForward className="size-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10 p-0 text-neutral-400 hover:text-white", loopMode !== 'none' && "text-white")}
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
          <div className="flex items-center justify-center w-full max-w-sm sm:max-w-md gap-4 mt-8">
            <Button
              variant="ghost"
              size="icon"
              aria-label={liked.has(String(current?.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
              onClick={() => current && toggleLike(String(current.id))}
              className={cn(
                "size-10 p-0 text-neutral-400 hover:text-white",
                liked.has(String(current?.id)) && "text-red-500 fill-red-500 hover:text-red-500"
              )}
            >
              <Heart className={cn("size-6", liked.has(String(current?.id)) && "fill-current")} />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Volume2 className="size-5 text-neutral-300" />
              <Slider
                value={[vol]}
                max={100}
                step={1}
                onValueChange={(v) => setVolume((v[0] || 0) / 100)}
                className="flex-1 [&_span]:bg-white [&_div]:bg-neutral-700 [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0"
              />
              <span className="text-sm text-neutral-300 tabular-nums w-8 text-right">{vol}</span>
            </div>
          </div>
        </div>
        
        {/* ✅ Bloque de estilo para ocultar el botón de cierre por defecto */}
        {/* Este estilo es global y apunta al atributo 'data-slot="dialog-close"' */}
        <style jsx global>{`
          [data-slot="dialog-close"] {
            display: none !important;
          }
        `}</style>
      </DialogContent>
    </DialogRoot>
  );
}