// src/components/player/desktop-player-controls.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { usePlayer } from "./player-provider"
import { Pause, Play, SkipBack, SkipForward, Volume2, Heart, Shuffle, Repeat, Repeat1 } from 'lucide-react' 
import Image from "next/image"

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60)
  return `${m}:${ss.toString().padStart(2, "0")}`
}

export function DesktopPlayerControls() { // Renombrado a DesktopPlayerControls
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
    toggleLoop     
  } = usePlayer()

  const vol = Math.round(volume * 100)
  
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

  // Si no hay canción reproduciéndose, no mostrar los controles de desktop (o mostrar un estado vacío)
  // Decidimos mostrar un estado vacío para que la barra inferior siempre esté presente en desktop.
  if (!current) {
    return (
      <div className="flex flex-col gap-2 py-3 md:py-4 md:flex-row md:items-center md:gap-6 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center gap-3 flex-none w-full md:w-[200px] lg:w-[250px] xl:w-[300px]">
          <div className="size-12 md:size-14 overflow-hidden rounded-xl bg-neutral-100 flex-shrink-0">
            <Image src={defaultPlayerCoverUrl} width={64} height={64} alt="No Cover" className="size-full object-cover"/>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate text-neutral-500">Nada reproduciéndose</div>
            <div className="text-sm text-neutral-500 truncate">Selecciona una pista</div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center justify-center gap-3 w-full"> 
            <Button variant="ghost" size="icon" className="rounded-full"><Shuffle className="size-5 text-neutral-400" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full"><SkipBack className="size-5 text-neutral-400" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full border border-neutral-300"><Play className="size-5 text-neutral-400" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full"><SkipForward className="size-5 text-neutral-400" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full"><Repeat className="size-5 text-neutral-400" /></Button>
            <div className="flex items-center gap-2 ml-4">
              <Volume2 className="size-4 text-neutral-400 flex-shrink-0" />
              <Slider value={[0]} max={100} step={1} className="w-[80px]" disabled />
              <span className="text-xs text-neutral-400 tabular-nums w-8 text-right">0</span> 
            </div>
          </div>
          <div className="w-full flex items-center gap-3">
            <span className="text-xs text-neutral-500 tabular-nums">0:00</span>
            <Slider value={[0]} max={1} step={1} className="w-full" disabled />
            <span className="text-xs text-neutral-500 tabular-nums">0:00</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-none w-[80px] lg:w-[100px] justify-end">
          <Button variant="ghost" size="icon" className="rounded-full"><Heart className="size-5 text-neutral-400" /></Button>
        </div>
      </div>
    ); 
  }


  return (
    <div className="flex flex-col gap-2 py-3 md:py-4 md:flex-row md:items-center md:gap-6 pb-[env(safe-area-inset-bottom)]">
      
      {/* Sección Izquierda: Info de la Pista y Botón de Like */}
      {/* En desktop: ancho fijo. */}
      <div className="flex items-center gap-3 flex-none w-full md:w-[200px] lg:w-[250px] xl:w-[300px]">
        {/* Artwork */}
        <div className="size-12 md:size-14 overflow-hidden rounded-xl bg-neutral-100 flex-shrink-0">
          <Image
            src={playerCoverSource}
            width={64}
            height={64}
            alt={`Carátula del álbum ${current?.album || "Desconocido"}`}
            className="size-full object-cover"
            onError={(e) => {
              console.error("PlayerBar image failed to load:", playerCoverSource);
              (e.target as HTMLImageElement).src = defaultPlayerCoverUrl;
            }}
          />
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1"> {/* Permite que el texto se trunque pero no empuje */}
          <div className="font-medium truncate">{current?.title}</div>
          <div className="text-sm text-neutral-500 truncate">{current?.artist}</div>
        </div>

        {/* Botón Like (solo visible en desktop, en móvil está en la barra completa) */}
        {current && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={liked.has(String(current.id)) ? "Quitar de me gusta" : "Agregar a me gusta"}
            onClick={() => toggleLike(String(current.id))}
            className={cn(
              "ml-1 hover:bg-neutral-100 rounded-full hidden md:flex", // Oculto en móvil
              liked.has(String(current.id)) ? "text-black" : "text-neutral-500"
            )}
          >
            <Heart className={cn("size-5", liked.has(String(current.id)) && "fill-current")} />
          </Button>
        )}
      </div>

      {/* Sección Central: Controles de Transporte, Volumen y Barra de Progreso */}
      <div className="flex flex-col items-center gap-2 flex-1 min-w-0 order-last md:order-none">
        {/* Controles Principales (Shuffle, Prev, Play/Pause, Next, Loop, Volumen) */}
        <div className="flex items-center w-full justify-center gap-3"> {/* Centrado horizontalmente */}
          
          {/* Botón Shuffle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full hover:bg-neutral-100", shuffleMode ? "text-black" : "text-neutral-500")}
            onClick={toggleShuffle}
            aria-label="Modo aleatorio"
          >
            <Shuffle className="size-5" />
          </Button>

          {/* Botón Prev */}
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100" onClick={prev} aria-label="Anterior">
            <SkipBack className="size-5" />
          </Button>

          {/* Botón Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-neutral-100 border border-black/10 flex-shrink-0" 
            onClick={toggle}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>

          {/* Botón Next */}
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-100" onClick={next} aria-label="Siguiente">
            <SkipForward className="size-5" />
          </Button>

          {/* Botón Loop */}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("rounded-full hover:bg-neutral-100", loopMode !== 'none' ? "text-black" : "text-neutral-500")}
            onClick={toggleLoop}
            aria-label={`Modo de repetición: ${loopMode === 'none' ? 'Ninguno' : loopMode === 'all' ? 'Toda la lista' : 'Una canción'}`}
          >
            {loopMode === 'one' ? (
              <Repeat1 className="size-5" />
            ) : (
              <Repeat className="size-5" />
            )}
          </Button>

          {/* ✅ Control de Volumen: Ahora a la derecha de todo el grupo de botones principales */}
          <div className="flex items-center gap-2 ml-4"> {/* Agrega margen izquierdo para separación */}
            <Volume2 className="size-4 text-neutral-500 flex-shrink-0" />
            <Slider
              value={[vol]}
              max={100}
              step={1}
              onValueChange={(v) => setVolume((v[0] || 0) / 100)}
              className="w-[80px]" // Ancho fijo para desktop
            />
            <span className="text-xs text-neutral-500 tabular-nums w-8 text-right">{vol}</span> 
          </div>
        </div>

        {/* Seek Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-neutral-500 tabular-nums">{formatTime(progress)}</span>
          <Slider
            value={[Math.min(progress, duration || 0)]}
            max={Math.max(duration, 1)}
            step={1}
            onValueChange={(v) => seek(v[0] || 0)}
            className="w-full"
          />
          <span className="text-xs text-neutral-500 tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Sección Derecha: (Vacía en este diseño, Like en otros) */}
      <div className="hidden md:flex items-center gap-2 flex-none w-[80px] lg:w-[100px] justify-end">
        {/* Este espacio puede usarse para un botón de Like en desktop si se desea, o simplemente para balancear el layout */}
      </div>
    </div>
  )
}
