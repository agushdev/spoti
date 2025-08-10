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

  // ✅ Añadido console.log para ayudar a depurar la URL de la carátula
  console.log("Current track data for FullScreenPlayer:", current);

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
    // ✅ Añadido console.log si se usa la carátula por defecto
    console.log("Using default cover for FullScreenPlayer. artwork_url is missing/empty/invalid:", current?.artwork_url);
  }

  return (
    <Dialog open={isPlayerExpanded} onOpenChange={togglePlayerExpansion}>
      <DialogContent 
        className={cn(
          // Fullscreen real y elimina márgenes/padding predeterminados del DialogContent
          "fixed inset-0 w-screen h-screen p-0 m-0",
          // Flexbox para centrar y distribuir verticalmente el contenido
          "flex flex-col items-center justify-between",
          // Fondo y color de texto para el estilo oscuro (Spotify-like)
          "bg-black text-white",
          // Sobreescribir estilos predeterminados de Radix UI para asegurar el fullscreen
          "!translate-x-0 !translate-y-0 !top-0 !left-0 !max-w-none rounded-none border-none",
          // Animación de entrada/salida (opcional, puedes ajustar si lo necesitas)
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        )}
      >
        {/* DialogTitle invisible para accesibilidad, envuelto en VisuallyHidden */}
        <VisuallyHidden>
          <DialogTitle>Reproductor a Pantalla Completa</DialogTitle>
        </VisuallyHidden>

        {/* Botón de Cerrar (arriba a la izquierda, el único) */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayerExpansion}
          className="absolute top-4 left-4 z-20 rounded-full text-white hover:bg-neutral-800"
          aria-label="Cerrar reproductor"
        >
          <X className="size-6" />
        </Button>

        {/* Contenido principal (imagen y texto) */}
        {/* flex-1 para que ocupe el espacio disponible verticalmente y centre su contenido */}
        {/* pt-16 para dar espacio al botón de cerrar en la parte superior, pb-4 para espacio inferior */}
        <div className="flex-1 flex flex-col items-center justify-center w-full px-4 pt-16 pb-4 md:px-6 md:pt-20 md:pb-6 gap-6"> 
          {/* Contenedor de la Imagen de la Carátula */}
          {/* Ajustes para un tamaño responsivo que se vea bien en móvil, centrado y con sombra */}
          <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg
                          max-w-full sm:max-w-sm md:max-w-md lg:max-w-lg" /* ✅ max-w-full y breakpoints para imagen */
                          style={{ maxWidth: 'min(80vw, 400px)' }} /* ✅ Ajuste CSS inline para un control fino en móvil */
          >
            <Image
              src={playerCoverSource}
              alt={`Carátula de ${current?.album || "Desconocido"}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 80vw, 50vw" 
              className="object-cover"
              onError={(e) => {
                console.error("Full screen image failed to load:", playerCoverSource);
                (e.target as HTMLImageElement).src = defaultCover; 
              }}
            />
          </div>

          {/* Título y Artista */}
          <div className="text-center w-full px-2"> 
            <h2 className="text-2xl font-bold truncate">{current?.title || "Nada reproduciéndose"}</h2>
            <p className="text-lg text-neutral-400 truncate">{current?.artist || "Selecciona una pista"}</p>
          </div>
        </div>

        {/* Controles del reproductor (bottom section) */}
        {/* flex-none para que no se estire, con padding responsivo */}
        <div className="w-full flex-none flex flex-col gap-4 px-4 pb-8 md:px-6 md:pb-10">
          {/* Seek Bar */}
          <div className="w-full flex items-center gap-3 text-neutral-400"> 
            <span className="text-sm tabular-nums">{formatTime(progress)}</span>
            <Slider
              value={[Math.min(progress, duration || 0)]}
              max={Math.max(duration, 1)}
              step={1}
              onValueChange={(v) => seek(v[0] || 0)}
              // ✅ Clases para el slider: track blanco, thumb blanco y eliminar el outline/ring en focus
              className="flex-1 [&_span]:bg-white [&_div]:bg-white [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0" 
            />
            <span className="text-sm tabular-nums">{formatTime(duration)}</span>
          </div>

          {/* Controles de Playback (Shuffle, Prev, Play/Pause, Next, Loop) */}
          <div className="flex items-center justify-center gap-6">
            {/* Botón Shuffle */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full hover:bg-neutral-800 text-neutral-400", shuffleMode && "text-white")}
              onClick={toggleShuffle}
              aria-label="Modo aleatorio"
            >
              <Shuffle className="size-6" />
            </Button>

            {/* Botón Prev */}
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-800 text-neutral-400" onClick={prev} aria-label="Anterior">
              <SkipBack className="size-6" />
            </Button>

            {/* Botón Play/Pause */}
            <Button
              variant="ghost"
              size="lg" 
              className="rounded-full hover:bg-neutral-800 border border-neutral-700 flex-shrink-0 text-white" 
              onClick={toggle}
              aria-label={isPlaying ? "Pausar" : "Reproducir"}
            >
              {isPlaying ? <Pause className="size-8" /> : <Play className="size-8" />}
            </Button>

            {/* Botón Next */}
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-800 text-neutral-400" onClick={next} aria-label="Siguiente">
              <SkipForward className="size-6" />
            </Button>

            {/* Botón Loop */}
            <Button
              variant="ghost"
              size="icon"
              className={cn("rounded-full hover:bg-neutral-800 text-neutral-400", loopMode !== 'none' && "text-white")}
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

          {/* Control de Volumen y Botón Like */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {/* Botón Like (visible en todas las pantallas aquí) */}
            {current && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={liked.has(String(current.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
                onClick={() => toggleLike(String(current.id))}
                className={cn(
                  "hover:bg-neutral-800 rounded-full text-neutral-400",
                  liked.has(String(current.id)) && "text-white fill-white" 
                )}
              >
                <Heart className={cn("size-6", liked.has(String(current.id)) && "fill-current")} />
              </Button>
            )}

            {/* Slider de Volumen */}
            <Volume2 className="size-5 text-neutral-400 flex-shrink-0" />
            <Slider
              value={[vol]}
              max={100}
              step={1}
              onValueChange={(v) => setVolume((v[0] || 0) / 100)}
              // ✅ Clases para el slider: track blanco, thumb blanco y eliminar el outline/ring en focus
              className="flex-1 max-w-[200px] [&_span]:bg-white [&_div]:bg-white [&>span:first-child]:focus-visible:outline-none [&>span:first-child]:focus-visible:ring-0 [&>span:first-child]:ring-offset-0" 
            />
            <span className="text-sm text-neutral-400 tabular-nums w-8 text-right">{vol}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}